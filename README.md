# RAIN – IT Asset Management System

## Overview
RAIN is a web-based IT Asset Management system designed to track, manage, and organise organisational IT assets. The system emphasises secure data handling, clear workflows, and scalable cloud deployment using Microsoft Azure.

This project is developed for academic and demonstration purposes and follows industry-aligned cloud and DevOps practices.

---

## Cloud Architecture (Planned Deployment)
RAIN is designed to be deployed on Microsoft Azure with the following architecture:

- **Frontend**: Containerised web application
- **Compute**: Azure Container Apps
- **Database**: Azure SQL Database
- **Storage**: Azure Blob Storage
- **Secrets Management**: Azure Key Vault
- **Container Registry**: Azure Container Registry
- **CI/CD**: GitHub Actions
- **Monitoring & Logging**: Azure Monitor and Log Analytics

This architecture supports scalability, security, and maintainability.

---

## Project Structure
/src Application source code
/docs Architecture and design documentation
/infra Infrastructure as Code (Azure)
/.github CI/CD workflows

---

## Deployment Approach
The application is containerised and deployed through an automated CI/CD pipeline. Builds are pushed to Azure Container Registry and deployed to Azure Container Apps. Configuration values and secrets are managed securely using Azure Key Vault.

---

## Notes
- This repository represents the intended Azure deployment architecture.
- Infrastructure and services may be refined during development.
- All application logic is manually implemented using standard web technologies.
