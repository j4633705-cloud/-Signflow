#!/bin/sh

# 🚀 Starting signflow...
printf "🚀 Starting signflow...\n\n"

# 🔐 Check certificate configuration
printf "🔐 Checking certificate configuration...\n"

CERT_PATH="${NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH:-/opt/signflow/cert.p12}"

if [ -f "$CERT_PATH" ] && [ -r "$CERT_PATH" ]; then
    printf "✅ Certificate file found and readable - document signing is ready!\n"
else
    printf "⚠️ Certificate not found or not readable\n"
    printf "💡 Tip: signflow will still start, but document signing will be unavailable\n"
    printf "🔧 Check: http://localhost:3000/api/certificate-status for detailed status\n"
fi

printf "\n📚 Useful Links:\n"
printf "📖 Documentation: https://docs.signflow.com\n"
printf "🐳 Self-hosting guide: https://docs.signflow.com/developers/self-hosting\n"
printf "🔐 Certificate setup: https://docs.signflow.com/developers/self-hosting/signing-certificate\n"
printf "🏥 Health check: http://localhost:3000/api/health\n"
printf "📊 Certificate status: http://localhost:3000/api/certificate-status\n"
printf "👥 Community: https://github.com/signflow/signflow\n\n"

printf "🗄️  Running database migrations...\n"
npx prisma migrate deploy --schema ../../packages/prisma/schema.prisma

printf "🌟 Starting signflow server...\n"
HOSTNAME=0.0.0.0 node build/server/main.js
