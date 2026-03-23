#!/bin/bash
# ----------------------------------------------------
# 🏭 Athena 3.0 Forklift: Park Site (Move to Warehouse)
# ----------------------------------------------------
# This script moves a finished site OUT of the active
# development factory and INTO the secure storage vault.

SITE=$1
FACTORY_DIR=$(pwd)
VAULT_DIR=$(cd .. && pwd)/athena-vault-storage

if [ -z "$SITE" ]; then
    echo "❌ Usage: pnpm run park <site-name>"
    exit 1
fi

SITE_PATH=""
if [ -d "sites/$SITE" ]; then
    SITE_PATH="sites/$SITE"
elif [ -d "sites-external/$SITE" ]; then
    SITE_PATH="sites-external/$SITE"
else
    echo "❌ Site '$SITE' niet gevonden in sites/ of sites-external/"
    exit 1
fi

echo "📦 Parking site '$SITE' to storage vault..."

# Ensure vault directory exists
mkdir -p "$VAULT_DIR"

# Check if it already exists in vault
if [ -d "$VAULT_DIR/$SITE" ]; then
    echo "❌ Error: Site '$SITE' bestaat al in the vault ($VAULT_DIR/$SITE)!"
    echo "Verwijder of hernoem deze in de vault voordat je opnieuw parkeert."
    exit 1
fi

# Prevent carrying heavy dependencies or build artifacts to the Warehouse
# (This saves massive amounts of disk space on your Chromebook)
echo "🧹 Dehydrating site (removing node_modules & dist)..."
rm -rf "$SITE_PATH/node_modules"
rm -rf "$SITE_PATH/dist"

# Move the directory
mv "$SITE_PATH" "$VAULT_DIR/"

# Auto-commit the removal so Git doesn't complain
echo "🔄 Bevestigen aan Git (auto-commit)..."
cd "$FACTORY_DIR" || exit
git add "$SITE_PATH"
git commit -m "📦 Parked $SITE to Vault"

echo "✅ Success! '$SITE' is veilig opgeborgen in de Warehouse ($VAULT_DIR) en de factory git is opgeschoond."
echo "   (Vergeet niet af en toe een 'git push' te doen)."
