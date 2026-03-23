#!/bin/bash
# ----------------------------------------------------
# 🏭 Athena 3.0 Forklift: Retrieve Site (Move to Factory)
# ----------------------------------------------------
# This script retrieves a parked site OUT of the secure
# storage vault and INTO the active development factory.

SITE=$1
VAULT_DIR=$(cd .. && pwd)/athena-vault-storage
DEST_DIR="sites" # Default destination

if [ -z "$SITE" ]; then
    echo "❌ Usage: pnpm run retrieve <site-name>"
    exit 1
fi

if [ ! -d "$VAULT_DIR/$SITE" ]; then
    echo "❌ Bummer! Site '$SITE' niet gevonden in de Warehouse ($VAULT_DIR/)."
    exit 1
fi

echo "🏗️ Retrieving site '$SITE' from storage vault..."

# We assume standard sites go to 'sites/'. If you want to retrieve it to 'sites-external/', 
# you can pass that as a second argument, e.g., `pnpm run retrieve my-site sites-external`
if [ -n "$2" ]; then
    DEST_DIR="$2"
fi

# Check if it already exists in factory
if [ -d "$DEST_DIR/$SITE" ]; then
    echo "❌ Error: Site '$SITE' bestaat al in de factory ($DEST_DIR/$SITE)!"
    exit 1
fi

# Move the directory
mv "$VAULT_DIR/$SITE" "$DEST_DIR/"

echo "✅ Success! '$SITE' staat weer in de werkplaats ($DEST_DIR/$SITE)."
echo "Je kan deze nu veilig bewerken. Zodra de wijzigingen gepusht en gepubliceerd zijn,"
echo "vergeet de site dan niet terug te parkeren met 'pnpm run park $SITE'."
