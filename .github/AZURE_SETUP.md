# Azure Deployment Setup Guide

This guide explains how to set up Azure credentials and deploy the Xmas Wishlist application to Azure.

## Prerequisites

- Azure subscription
- Azure CLI installed (optional, for creating service principal)
- GitHub repository access

> **Note**: Replace all placeholder values (like `YOUR_SUBSCRIPTION_ID`) with your actual Azure values. These should not be committed to the repository if this is a public repo.

## Step 1: Create Azure Service Principal

You need a service principal (service account) for GitHub Actions to deploy to Azure.

### Option A: Using Azure CLI (Recommended)

1. **Install Azure CLI** (if not already installed):
   - Windows: Download from [Azure CLI](https://aka.ms/installazurecliwindows)
   - Or use: `winget install -e --id Microsoft.AzureCLI`

2. **Login to Azure**:
   ```bash
   az login
   ```

3. **Set the subscription**:
   ```bash
   az account set --subscription YOUR_SUBSCRIPTION_ID
   ```
   
   > Replace `YOUR_SUBSCRIPTION_ID` with your actual Azure subscription ID. You can find it by running `az account list --output table`

4. **Create the service principal**:
   ```bash
   az ad sp create-for-rbac --name "xmas-wishlist-github-actions" \
     --role contributor \
     --scopes /subscriptions/YOUR_SUBSCRIPTION_ID \
     --sdk-auth
   ```
   
   > Replace `YOUR_SUBSCRIPTION_ID` with your actual Azure subscription ID

5. **Copy the JSON output** - it will look like this:
   ```json
   {
     "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
     "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
     "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
     "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
     "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
     "resourceManagerEndpointUrl": "https://management.azure.com/",
     "activeDirectoryGraphResourceId": "https://graph.windows.net/",
     "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
     "galleryEndpointUrl": "https://gallery.azure.com/",
     "managementEndpointUrl": "https://management.core.windows.net/"
   }
   ```
   
   > **Important**: Keep this JSON secure! The `clientSecret` is sensitive and should never be committed to the repository.

### Option B: Using Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Name: `xmas-wishlist-github-actions`
5. Supported account types: **Single tenant**
6. Click **Register**
7. Note the **Application (client) ID** and **Directory (tenant) ID**
8. Go to **Certificates & secrets** → **New client secret**
9. Add description and expiration, click **Add**
10. **Copy the secret value** (you won't see it again!)
11. Go to **Subscriptions** → Select your subscription
12. Go to **Access control (IAM)** → **Add** → **Add role assignment**
13. Role: **Contributor**
14. Assign access to: **User, group, or service principal**
15. Select: `xmas-wishlist-github-actions`
16. Click **Review + assign**

## Step 2: Generate JWT Secret

Generate a strong random secret for JWT token signing:

**On Windows (PowerShell)**:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**On Linux/Mac**:
```bash
openssl rand -base64 64
```

**Or use an online generator**: https://randomkeygen.com/

Save this secret - you'll need it for GitHub Secrets.

## Step 3: Configure GitHub Secrets

1. Go to your GitHub repository: https://github.com/pgsaari/xmas-wishlist
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each of the following:

### Required Secrets

| Secret Name | Value | Description |
|------------|-------|-------------|
| `AZURE_SUBSCRIPTION_ID` | `YOUR_SUBSCRIPTION_ID` | Your Azure subscription ID (find with `az account list`) |
| `AZURE_TENANT_ID` | `YOUR_TENANT_ID` | Your Azure tenant ID (find with `az account show --query tenantId`) |
| `AZURE_CLIENT_ID` | (from service principal JSON) | Service principal client ID |
| `AZURE_CLIENT_SECRET` | (from service principal JSON) | Service principal client secret (⚠️ **KEEP SECRET!**) |
| `RESOURCE_GROUP_NAME` | `rg-xmas-wishlist` | Azure resource group name |
| `LOCATION` | `centralus` (or your preferred region) | Azure region |
| `JWT_SECRET` | (generated secret) | JWT signing secret (64+ characters, ⚠️ **KEEP SECRET!**) |

> **Security Note**: 
> - Subscription ID and Tenant ID are not secrets, but for public repositories, it's better practice to use placeholders
> - **Never commit** `AZURE_CLIENT_SECRET` or `JWT_SECRET` to the repository
> - These values should only be stored in GitHub Secrets

## Step 4: Initial Deployment

Once all secrets are configured:

1. **Merge to main branch** - The deployment workflow will trigger automatically
2. **Or manually trigger** - Go to **Actions** → **Deploy to Azure** → **Run workflow**

## Step 5: Access Your Application

After deployment completes:

1. Check the GitHub Actions workflow output for:
   - **Frontend URL**: `https://xmas-wishlist-frontend.azurestaticapps.net`
   - **Backend URL**: `https://xmas-wishlist-backend.azurewebsites.net`

2. The frontend will be automatically configured to use the backend URL

## Architecture

- **Frontend**: Azure Static Web Apps (Free tier)
  - Hosts the React application
  - Global CDN, automatic HTTPS
  - Free tier: 100 GB bandwidth/month

- **Backend**: Azure App Service (Basic B1 tier)
  - Hosts the Node.js/Express API
  - Cost: ~$13/month
  - Persistent storage for Lowdb JSON database
  - Auto-scaling available if needed

## Cost Estimate

- **Static Web Apps**: Free (100 GB bandwidth/month)
- **App Service Basic B1**: ~$13/month
- **Total**: ~$13/month

## Troubleshooting

### Deployment Fails

1. Check GitHub Actions logs for errors
2. Verify all secrets are set correctly
3. Check Azure portal for resource creation errors
4. Ensure service principal has Contributor role

### Frontend Can't Connect to Backend

1. Verify `FRONTEND_URL` is set in App Service configuration
2. Check backend CORS settings
3. Verify backend is running (check App Service logs)
4. Check network requests in browser console

### Database Not Persisting

1. Lowdb JSON file is stored in `/home/site/wwwroot/db.json`
2. This location persists across deployments
3. If data is lost, check App Service logs for errors

## Updating Deployment

The deployment workflow runs automatically on every merge to `main`. To update:

1. Make your changes
2. Create a pull request
3. Merge to `main`
4. Deployment will trigger automatically

## Manual Deployment

To deploy manually without merging:

1. Go to **Actions** → **Deploy to Azure**
2. Click **Run workflow**
3. Select branch (usually `main`)
4. Click **Run workflow**

## Cleanup

To remove all Azure resources:

```bash
az group delete --name rg-xmas-wishlist --yes --no-wait
```

Or delete the resource group from Azure Portal.

## Support

For issues or questions:
- Check GitHub Actions logs
- Check Azure Portal → App Service → Logs
- Check Azure Portal → Static Web App → Deployment logs

