# GitHub Actions CI/CD

## Setup

To enable automatic deployments on push to main branch:

1. Go to your repository Settings → Secrets and variables → Actions

2. Add the following secrets:

   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
   - `API_URL`: Your API Gateway URL (after first deployment)
   - `S3_BUCKET_NAME`: Your S3 bucket name (after first deployment)
   - `CLOUDFRONT_DIST_ID`: Your CloudFront distribution ID (after first deployment)

3. Push to main branch and the workflow will automatically deploy

## Manual Deployment

You can also trigger deployment manually:

1. Go to Actions tab
2. Select "Deploy to AWS" workflow
3. Click "Run workflow"

## First Deployment

For the first deployment, run locally:

```bash
./scripts/deploy.sh
```

Then add the outputs as GitHub secrets for future automated deployments.