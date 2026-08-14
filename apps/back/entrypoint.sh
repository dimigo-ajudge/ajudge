#!/bin/sh
npm run db:migrate
exec bun dist/cluster.js
