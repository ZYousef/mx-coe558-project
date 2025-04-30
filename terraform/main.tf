terraform {
  required_version = ">= 1.3.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 4.0.0"
    }
  }
}

provider "google" {
  project = var.project
  region  = var.region
}

# Enable required GCP APIs
resource "google_project_service" "enable_services" {
  for_each = toset([
    "cloudfunctions.googleapis.com",
    "run.googleapis.com",
    "apigateway.googleapis.com",
    "iam.googleapis.com",
  ])
  service = each.key
}

variable "project" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for Cloud Run and Functions"
  type        = string
  default     = "europe-west1"
}

################################################################
# Cloud Functions (GenAI & Weather)
################################################################

resource "google_cloudfunctions_function" "weather" {
  name        = "weather"
  runtime     = "nodejs20"
  entry_point = "weather"
  region      = var.region
  trigger_http            = true
  available_memory_mb     = 128
  source_directory        = "${path.module}/weather-service"
  environment_variables = {
    # any needed env vars
  }
}

resource "google_cloudfunctions_function" "genai" {
  name        = "generate"
  runtime     = "nodejs20"
  entry_point = "generate"
  region      = var.region
  trigger_http            = true
  available_memory_mb     = 256
  source_directory        = "${path.module}/genai-service"
  environment_variables = {
    # must provide your GenAI key as secret or env var
    GENAI_API_KEY = var.genai_api_key
  }
}

variable "genai_api_key" {
  description = "API key for OpenAI Image Generation"
  type        = string
  sensitive   = true
}

################################################################
# Cloud Run (CRUD & Frontend)
################################################################

resource "google_cloud_run_service" "crud" {
  name     = "crud-service"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project}/crud-service"
        ports {
          container_port = 8080
        }
      }
    }
  }

  traffics {
    percent         = 100
    latest_revision = true
  }
}

resource "google_cloud_run_service" "frontend" {
  name     = "frontend"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project}/frontend"
        ports {
          container_port = 8080
        }
      }
    }
  }

  traffics {
    percent         = 100
    latest_revision = true
  }
}

################################################################
# API Gateway
################################################################

resource "google_api_gateway_api" "api" {
  api_id = "coe558-api"
}

resource "google_api_gateway_api_config" "cfg" {
  api       = google_api_gateway_api.api.name
  config_id = "v1"

  openapi_documents {
    path     = "${path.module}/openapi.yaml"
    # no need to set contents; file is read from local
  }

  depends_on = [
    google_project_service.enable_services,
    google_cloudfunctions_function.weather,
    google_cloudfunctions_function.genai,
    google_cloud_run_service.crud
  ]
}

resource "google_api_gateway_gateway" "gateway" {
  gateway_id = "coe558-gateway"
  api        = google_api_gateway_api.api.name
  api_config = google_api_gateway_api_config.cfg.id
  location   = var.region
}

################################################################
# Outputs
################################################################

output "weather_url" {
  description = "Weather Function HTTP URL"
  value       = google_cloudfunctions_function.weather.https_trigger_url
}

output "genai_url" {
  description = "GenAI Function HTTP URL"
  value       = google_cloudfunctions_function.genai.https_trigger_url
}

output "crud_url" {
  description = "CRUD Cloud Run URL"
  value       = google_cloud_run_service.crud.status[0].url
}

output "frontend_url" {
  description = "Frontend Cloud Run URL"
  value       = google_cloud_run_service.frontend.status[0].url
}

output "gateway_url" {
  description = "API Gateway default hostname"
  value       = google_api_gateway_gateway.gateway.default_hostname
}
