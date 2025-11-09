# Quick Start: Azure Deployment

## Prerequisites Checklist

- [ ] Azure subscription
- [ ] GitHub repository access
- [ ] Azure CLI installed (optional, for creating service principal)

> **Note**: Replace all `YOUR_*` placeholders with your actual Azure values. For a public repository, never commit actual subscription IDs, tenant IDs, or secrets.

## Step 1: Create Service Principal

Run this command in Azure CLI:

```bash
az login
az account set --subscription YOUR_SUBSCRIPTION_ID
az ad sp create-for-rbac --name "xmas-wishlist-github-actions" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID \
  --sdk-auth
```

> Replace `YOUR_SUBSCRIPTION_ID` with your actual Azure subscription ID (find with `az account list --output table`)

Copy the JSON output - you'll need the `clientId` and `clientSecret`. **Keep the `clientSecret` secure!**

## Step 2: Generate JWT Secret

**PowerShell:**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**Linux/Mac:**
```bash
openssl rand -base64 64
```

## Step 3: Add GitHub Secrets

Go to your repository settings: `https://github.com/YOUR_USERNAME/xmas-wishlist/settings/secrets/actions`

Add these secrets:

| Secret Name | Value |
|------------|-------|
| `AZURE_SUBSCRIPTION_ID` | `YOUR_SUBSCRIPTION_ID` (find with `az account list`) |
| `AZURE_TENANT_ID` | `YOUR_TENANT_ID` (find with `az account show --query tenantId`) |
| `AZURE_CLIENT_ID` | (from service principal JSON) |
| `AZURE_CLIENT_SECRET` | (from service principal JSON) ⚠️ **KEEP SECRET!** |
| `RESOURCE_GROUP_NAME` | `rg-xmas-wishlist` |
| `LOCATION` | `centralus` (or your preferred region) |
| `JWT_SECRET` | (generated secret) ⚠️ **KEEP SECRET!** |

> **Security**: Never commit these values to the repository. Store them only in GitHub Secrets.

## Step 4: Deploy

1. **Merge to main branch** - Deployment will trigger automatically
2. **Or manually trigger** - Go to Actions → Deploy to Azure → Run workflow

## Step 5: Access Your App

After deployment, check the workflow output for:
- **Frontend URL**: `https://xmas-wishlist-frontend.azurestaticapps.net`
- **Backend URL**: `https://xmas-wishlist-backend.azurewebsites.net`

## Troubleshooting

- **Deployment fails**: Check GitHub Actions logs
- **Frontend can't connect**: Verify `FRONTEND_URL` is set in App Service
- **Database not working**: Check App Service logs, verify `/home` directory permissions

## Cost

- Static Web Apps: **Free** (100 GB/month)
- App Service Basic B1: **~$13/month**
- **Total: ~$13/month**

## Next Steps

- Monitor deployments in GitHub Actions
- Check Azure Portal for resource status
- View logs in App Service → Log stream
- Update environment variables in App Service → Configuration

For detailed setup instructions, see [AZURE_SETUP.md](./AZURE_SETUP.md)

