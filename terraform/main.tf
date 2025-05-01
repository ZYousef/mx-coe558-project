terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.run_region
}

variable "project_id" {}
variable "run_region" {
  description = "Region for Cloud Run services"
  default     = "me-west1"
}
variable "firestore_region" {
  description = "Region for Firestore"
  default     = "me-west1"
}
variable "gateway_region" {
  description = "Region for API Gateway"
  default     = "europe-west1"
}
variable "genai_api_key" {
  description = "API key for OpenAI in GenAI service"
  type        = string
  sensitive   = true
}

data "template_file" "openapi" {
  # openapi.yaml.tpl is in the parent folder
  template = file("${path.module}/../openapi.yaml.tpl")

  vars = {
    # Inject the API Gateway’s service-control name into the host:
    service_control = google_api_gateway_api.gateway.managed_service
  }
}

# Enable required Google APIs
resource "google_project_service" "cloud_run" {
  service                    = "run.googleapis.com"
  disable_dependent_services = true
}
resource "google_project_service" "cloud_build" {
  service                    = "cloudbuild.googleapis.com"
  disable_dependent_services = true
}
resource "google_project_service" "firestore" {
  service                    = "firestore.googleapis.com"
  disable_dependent_services = true
}
resource "google_project_service" "api_gateway" {
  service                    = "apigateway.googleapis.com"
  disable_dependent_services = true
}

# Firestore database
resource "google_firestore_database" "default" {
  name       = "(default)"
  project    = var.project_id
  location_id = var.firestore_region
  type       = "NATIVE"
}

# Cloud Run: Weather Service
resource "google_cloud_run_service" "weather" {
  name     = "weather-service"
  location = var.run_region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/weather-service:latest"
      }
    }
  }
  traffics {
    percent         = 100
    latest_revision = true
  }
}
resource "google_cloud_run_service_iam_member" "weather_invoker" {
  service  = google_cloud_run_service.weather.name
  location = google_cloud_run_service.weather.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Cloud Run: GenAI Service
resource "google_cloud_run_service" "genai" {
  name     = "genai-service"
  location = var.run_region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/genai-service:latest"
        env {
          name  = "GENAI_API_KEY"
          value = var.genai_api_key
        }
      }
    }
  }
  traffics {
    percent         = 100
    latest_revision = true
  }
}
resource "google_cloud_run_service_iam_member" "genai_invoker" {
  service  = google_cloud_run_service.genai.name
  location = google_cloud_run_service.genai.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Cloud Run: CRUD Service
resource "google_cloud_run_service" "crud" {
  name     = "crud-service"
  location = var.run_region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/crud-service:latest"
        env {
          name  = "GOOGLE_CLOUD_PROJECT"
          value = var.project_id
        }
      }
    }
  }

  traffics {
    percent         = 100
    latest_revision = true
  }
}
resource "google_cloud_run_service_iam_member" "crud_invoker" {
  service  = google_cloud_run_service.crud.name
  location = google_cloud_run_service.crud.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# API Gateway Definition
resource "google_api_gateway_api" "gateway" {
  api_id = "coe558-api"
}
resource "google_api_gateway_api_config" "gateway_cfg" {
  api       = google_api_gateway_api.gateway.name
  config_id = "coe558-config"

  openapi_documents {
    path     = "openapi.yaml"
    contents = data.template_file.openapi.rendered
  }
}
resource "google_api_gateway_gateway" "gateway" {
  gateway_id = "coe558-gateway"
  api_config = google_api_gateway_api_config.gateway_cfg.id
  location   = var.gateway_region
}

# Outputs
output "weather_url" {
  value = google_cloud_run_service.weather.status[0].url
}
output "genai_url" {
  value = google_cloud_run_service.genai.status[0].url
}
output "crud_url" {
  value = google_cloud_run_service.crud.status[0].url
}
output "gateway_url" {
  value = google_api_gateway_gateway.gateway.default_hostname
}
