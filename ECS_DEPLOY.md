# Deploy To AWS ECS Fargate

This app already has a Docker image definition in `Dockerfile`. The quickest AWS path is:

1. Push the image to Amazon ECR.
2. Register the ECS task definition in `ecs-task-definition.json`.
3. Create an ECS Fargate service.

## 1. Prerequisites

- AWS CLI configured for the target account and region.
- Docker installed locally.
- An IAM role named `ecsTaskExecutionRole`, or update the ARN in `ecs-task-definition.json`.

AWS docs used:
- ECR push: https://docs.aws.amazon.com/AmazonECR/latest/userguide/docker-push-ecr-image.html
- ECS Fargate task definitions: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html
- ECS Fargate getting started: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/getting-started-fargate.html

## 2. Set variables

```bash
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REPO=music-recommender-api
export IMAGE_TAG=latest
```

## 3. Create ECR repo

```bash
aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION
```

## 4. Build and push the image

```bash
docker build -t $ECR_REPO:$IMAGE_TAG .
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker tag $ECR_REPO:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG
```

## 5. Update the task definition placeholders

In `ecs-task-definition.json`, replace:

- `<AWS_ACCOUNT_ID>`
- `<AWS_REGION>`

## 6. Create CloudWatch log group

```bash
aws logs create-log-group --log-group-name /ecs/music-recommender-api --region $AWS_REGION
```

If it already exists, AWS returns an error you can ignore.

## 7. Create the ECS cluster

```bash
aws ecs create-cluster --cluster-name music-recommender-cluster
```

## 8. Register the task definition

```bash
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json
```

## 9. Create the service

You need:
- two subnets in your VPC
- one security group that allows inbound TCP `8000`

Example:

```bash
aws ecs create-service \
  --cluster music-recommender-cluster \
  --service-name music-recommender-service \
  --task-definition music-recommender-api \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-abc123,subnet-def456],securityGroups=[sg-abc123],assignPublicIp=ENABLED}"
```

## 10. Open the app

Find the task public IP:

```bash
aws ecs list-tasks --cluster music-recommender-cluster
aws ecs describe-tasks --cluster music-recommender-cluster --tasks <TASK_ARN>
```

Then open:

```text
http://<PUBLIC_IP>:8000/
```

## Notes

- This is the simplest public-IP deployment. For production, put the service behind an Application Load Balancer.
- Fargate requires valid CPU and memory combinations. This task definition uses `512` CPU and `1024` memory, which is a supported combination in AWS ECS Fargate docs.
