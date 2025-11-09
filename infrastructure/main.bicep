targetScope = 'resourceGroup'

param appName string = 'xmas-wishlist'
param location string = resourceGroup().location
@secure()
param jwtSecret string = ''

// Frontend - Static Web App
resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: '${appName}-frontend'
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: 'https://github.com/pgsaari/xmas-wishlist'
    branch: 'main'
    buildProperties: {
      appLocation: '/frontend'
      apiLocation: ''
      outputLocation: 'dist'
      appArtifactLocation: 'dist'
    }
    provider: 'None'
  }
}

// Backend - App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${appName}-plan'
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
    capacity: 1
  }
  kind: 'linux'
  properties: {
    reserved: true // Required for Linux App Service
  }
}

// Backend - App Service
resource appService 'Microsoft.Web/sites@2023-01-01' = {
  name: '${appName}-backend'
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      appSettings: [
        {
          name: 'JWT_SECRET'
          value: jwtSecret
        }
        {
          name: 'PORT'
          value: '8080'
        }
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'FRONTEND_URL'
          value: 'https://${staticWebApp.properties.defaultHostname}'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
        {
          name: 'DB_PATH'
          value: '/home'
        }
      ]
      alwaysOn: true
      http20Enabled: true
      minTlsVersion: '1.2'
    }
    httpsOnly: true
  }
}

// Output the frontend URL
output frontendUrl string = 'https://${staticWebApp.properties.defaultHostname}'

// Output the backend URL
output backendUrl string = 'https://${appService.name}.azurewebsites.net'

// Note: Deployment token is retrieved via Azure CLI in the workflow
// instead of using listSecrets() which may not be available immediately after creation

// Output the app service name (for deployment)
output appServiceName string = appService.name

// Output the static web app name (for deployment token retrieval)
output staticWebAppName string = staticWebApp.name

// Output the resource group name
output resourceGroupName string = resourceGroup().name

