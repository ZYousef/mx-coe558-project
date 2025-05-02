terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.2.0"
    }
  }
}

provider "google" {
  project = var.project
  region  = var.region
}

provider "google-beta" {
  alias   = "beta"
  project = var.project
  region  = var.region
}

data "archive_file" "weather_zip" {
  type       = "zip"
  source_dir = "${path.module}/../weather-service"
  output_path = "${path.module}/weather-service.zip"
}

data "archive_file" "genai_zip" {
  type       = "zip"
  source_dir = "${path.module}/../genai-service"
  output_path = "${path.module}/genai-service.zip"
}

variable "region" {
  description = "Region for all services"
  type        = string
  default     = "us-central1"
}

variable "genai_api_key" {
  description = "API key for OpenAI in GenAI service"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.genai_api_key) > 0
    error_message = "The genai_api_key must not be empty."
  }
}

variable "project" {
  description = "GCP project ID"
  type        = string
}

data "template_file" "openapi" {
  template = file("${path.module}/../openapi.yaml.tpl")

  vars = {
    service_control     = "${google_api_gateway_api.gateway.api_id}.endpoints.${var.project}.cloud.goog"
    weather_backend_url = google_cloudfunctions_function.weather.https_trigger_url
    genai_backend_url   = google_cloudfunctions_function.genai.https_trigger_url
    crud_backend_url    = google_cloud_run_service.crud.status[0].url
  }
}

# Lookup numeric project number via gcloud for IAM bindings
data "external" "project_info" {
  program = ["bash", "-c", "gcloud projects describe ${var.project} --format=json"]
}

# Enable required Google APIs
resource "google_project_service" "crm" {
  service                    = "cloudresourcemanager.googleapis.com"
  disable_dependent_services = true
  disable_on_destroy         = true
  project                    = var.project
}


# Build and push CRUD container image
resource "null_resource" "build_crud_image" {
  provisioner "local-exec" {
    command = "gcloud builds submit ${path.module}/../crud-service --tag gcr.io/${var.project}/crud-service:latest"
  }
  triggers = {
    always_run = timestamp()
  }
  depends_on = [
    google_project_service.crm,
    google_project_service.enabled_apis["cloudbuild.googleapis.com"]
  ]
}









# Grant Cloud Functions service agent permission to read Artifact Registry
resource "google_project_iam_member" "artifact_registry_reader" {
  project = var.project
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:service-${data.external.project_info.result["projectNumber"]}@gcf-admin-robot.iam.gserviceaccount.com"
}


# Enable required APIs in bulk
locals {
  required_apis = [
    "run.googleapis.com",
    "firestore.googleapis.com",
    "apigateway.googleapis.com",
    "servicemanagement.googleapis.com",
    "servicecontrol.googleapis.com",
    "endpoints.googleapis.com",
    "cloudfunctions.googleapis.com",
    "storage.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
  ]
}

resource "google_project_service" "enabled_apis" {
  for_each = toset(local.required_apis)
  service                    = each.key
  project                    = var.project
  disable_dependent_services = true
  disable_on_destroy         = true
  depends_on                 = [google_project_service.crm]
}

# Cloud Run: CRUD Service
resource "google_cloud_run_service" "crud" {
  name     = "crud-service"
  location = var.region
  depends_on = [
    google_project_service.enabled_apis["run.googleapis.com"],
    null_resource.build_crud_image
  ]

  template {
    spec {
      containers {
        image = "gcr.io/${var.project}/crud-service:latest"
        env {
          name  = "GOOGLE_CLOUD_PROJECT"
          value = var.project
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  lifecycle {
    ignore_changes = [template[0].spec[0].containers[0].image]
  }

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "google_cloud_run_service_iam_member" "crud_invoker" {
  service  = google_cloud_run_service.crud.name
  location = google_cloud_run_service.crud.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Storage for Cloud Functions source
resource "google_storage_bucket" "function_source" {
  name     = "${var.project}-function-source"
  location = var.region
  project  = var.project
  depends_on = [
    google_project_service.crm,
    google_project_service.enabled_apis["storage.googleapis.com"]
  ]
}

resource "google_storage_bucket_object" "weather_source" {
  name           = "weather-service.zip"
  bucket         = google_storage_bucket.function_source.name
  source         = data.archive_file.weather_zip.output_path
  content_type   = "application/zip"
}

resource "google_storage_bucket_object" "genai_source" {
  name           = "genai-service.zip"
  bucket         = google_storage_bucket.function_source.name
  source         = data.archive_file.genai_zip.output_path
  content_type   = "application/zip"
}

# Cloud Functions: Weather
resource "google_cloudfunctions_function" "weather" {
  name                  = "weather"
  project               = var.project
  region                = var.region
  runtime               = "nodejs18"
  entry_point           = "weather"
  source_archive_bucket = google_storage_bucket.function_source.name
  source_archive_object = google_storage_bucket_object.weather_source.name
  trigger_http          = true
  available_memory_mb   = 256
  depends_on = [
    google_project_service.enabled_apis["cloudfunctions.googleapis.com"],
    google_storage_bucket_object.weather_source,
    google_project_iam_member.artifact_registry_reader
  ]
}

resource "google_cloudfunctions_function_iam_member" "weather_invoker" {
  project        = var.project
  region         = var.region
  cloud_function = google_cloudfunctions_function.weather.name
  role           = "roles/cloudfunctions.invoker"
  member         = "allUsers"
}

# Cloud Functions: GenAI
resource "google_cloudfunctions_function" "genai" {
  name                  = "genai"
  project               = var.project
  region                = var.region
  runtime               = "nodejs18"
  entry_point           = "generate"
  source_archive_bucket = google_storage_bucket.function_source.name
  source_archive_object = google_storage_bucket_object.genai_source.name
  trigger_http          = true
  available_memory_mb   = 256
  environment_variables = {
    GENAI_API_KEY = var.genai_api_key
  }
  depends_on = [
    google_project_service.enabled_apis["cloudfunctions.googleapis.com"],
    google_storage_bucket_object.genai_source,
    google_project_iam_member.artifact_registry_reader
  ]
}

resource "google_cloudfunctions_function_iam_member" "genai_invoker" {
  project        = var.project
  region         = var.region
  cloud_function = google_cloudfunctions_function.genai.name
  role           = "roles/cloudfunctions.invoker"
  member         = "allUsers"
}

# API Gateway Definition
resource "google_api_gateway_api" "gateway" {
  provider   = google-beta
  api_id     = "coe558-api"
  depends_on = [
    google_project_service.enabled_apis["apigateway.googleapis.com"],
    google_project_service.enabled_apis["servicemanagement.googleapis.com"],
    google_project_service.enabled_apis["servicecontrol.googleapis.com"],
    google_project_service.enabled_apis["endpoints.googleapis.com"],
  ]
  lifecycle {
    ignore_changes = [api_id]
  }
}

resource "google_api_gateway_api_config" "gateway_cfg" {
  provider      = google-beta
  api           = google_api_gateway_api.gateway.api_id
  api_config_id = "coe558-config"
  depends_on    = [
    google_api_gateway_api.gateway,
    google_cloud_run_service.crud,
    google_cloudfunctions_function.weather,
    google_cloudfunctions_function.genai,
    data.template_file.openapi
  ]

  openapi_documents {
    document {
      path     = "openapi.yaml"
      contents = base64encode(data.template_file.openapi.rendered)
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_api_gateway_gateway" "gateway" {
  provider   = google-beta
  gateway_id = "coe558-gateway"
  api_config = google_api_gateway_api_config.gateway_cfg.id
  region     = var.region
  depends_on = [google_api_gateway_api_config.gateway_cfg]
}

# Outputs
output "weather_url" {
  value = google_cloudfunctions_function.weather.https_trigger_url
}

output "genai_url" {
  value = google_cloudfunctions_function.genai.https_trigger_url
}

output "crud_url" {
  value = google_cloud_run_service.crud.status[0].url
}

output "gateway_url" {
  value = "https://${google_api_gateway_gateway.gateway.default_hostname}"
}

# ──────────────────────────────────────────────────────────────────────────────
# Frontend: Static site hosting in GCS
# ──────────────────────────────────────────────────────────────────────────────

# Build and deploy the React frontend
resource "null_resource" "deploy_frontend" {
  provisioner "local-exec" {
    command = <<EOT
cd ${path.module}/../frontend
npm install
npm run build
gsutil -m rsync -r dist gs://${google_storage_bucket.frontend.name}
EOT
  }
  triggers = {
    always_run = timestamp()
  }
  depends_on = [
    google_storage_bucket.frontend,
    google_storage_bucket_iam_member.frontend_public
  ]
}

# Storage bucket to host the frontend
resource "google_storage_bucket" "frontend" {
  name                        = "${var.project}-frontend"
  location                    = var.region
  uniform_bucket_level_access = true

  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }
}

# Make frontend bucket publicly readable
resource "google_storage_bucket_iam_member" "frontend_public" {
  bucket = google_storage_bucket.frontend.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Output the frontend URL
output "frontend_url" {
  value = "https://${google_storage_bucket.frontend.name}.storage.googleapis.com/index.html"
}