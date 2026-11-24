-- Separate database for automated tests, so tests never touch dev data.
CREATE DATABASE app_test OWNER app;
