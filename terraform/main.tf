# Create an ECR repository
resource "aws_ecr_repository" "itsm_bot_backend" {
  name                 = "itsm-bot/backend"
  image_tag_mutability = "MUTABLE"

  encryption_configuration {
    encryption_type = "AES256"
  }
}