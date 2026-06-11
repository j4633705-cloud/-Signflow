INSERT INTO "User" ("email", "name") VALUES (
  'serviceaccount@signflow.com',
  'Service Account'
) ON CONFLICT DO NOTHING;
