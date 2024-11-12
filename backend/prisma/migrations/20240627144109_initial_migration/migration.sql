-- CreateTable
CREATE TABLE "bots" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "image" VARCHAR(500),
    "config_location" VARCHAR(500) NOT NULL,

    CONSTRAINT "bots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255),
    "name" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profile_pic_url" VARCHAR(500),
    "is_of_legal_age" BOOLEAN,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tokens" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "fcm_token" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "title" VARCHAR(255),
    "body" VARCHAR(255) NOT NULL,
    "primary_thumbnail_url" VARCHAR(500),
    "secondary_thumbnail_url" VARCHAR(500),
    "is_actionable" BOOLEAN NOT NULL DEFAULT false,
    "action_taken" TEXT,
    "resource_type" VARCHAR(255) NOT NULL,
    "resource_id" VARCHAR(255) NOT NULL,
    "secondary_resource_type" VARCHAR(255),
    "secondary_resource_id" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_onboarding" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_onboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presigned_urls" (
    "id" TEXT NOT NULL,
    "user" VARCHAR(255) NOT NULL,
    "is_admin_media" BOOLEAN NOT NULL DEFAULT false,
    "key" VARCHAR(255) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "bucket" VARCHAR(255) NOT NULL DEFAULT 'slay-user-images',
    "content_type" VARCHAR(30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presigned_urls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banned_users" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banned_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255),
    "name" VARCHAR(255),
    "role" TEXT DEFAULT 'admin',
    "profile_pic_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "email_index" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_name_idx" ON "users"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_tokens_user_id_key" ON "user_tokens"("user_id");

-- CreateIndex
CREATE INDEX "user_tokens_user_id_idx" ON "user_tokens"("user_id");

-- CreateIndex
CREATE INDEX "user_notifications_user_id_idx" ON "user_notifications"("user_id");

-- CreateIndex
CREATE INDEX "user_notifications_resource_id_idx" ON "user_notifications"("resource_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_onboarding_user_id_key" ON "users_onboarding"("user_id");

-- CreateIndex
CREATE INDEX "presigned_urls_user_idx" ON "presigned_urls"("user");

-- CreateIndex
CREATE UNIQUE INDEX "banned_users_user_id_key" ON "banned_users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "banned_users_email_key" ON "banned_users"("email");

-- CreateIndex
CREATE INDEX "banned_users_email_idx" ON "banned_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "admin_users_email_idx" ON "admin_users"("email");

-- AddForeignKey
ALTER TABLE "user_tokens" ADD CONSTRAINT "user_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_onboarding" ADD CONSTRAINT "users_onboarding_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banned_users" ADD CONSTRAINT "banned_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
