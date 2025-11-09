@description('Parameter definitions for Xmas Wishlist infrastructure')

param appName string = 'xmas-wishlist'
param location string = 'centralus'
param environment string = 'production'

@secure()
@description('JWT secret for backend authentication')
param jwtSecret string

@secure()
@description('GitHub token for Static Web App deployment (optional)')
param githubToken string = ''

