#!/usr/bin/env bash

set -e
echo beforeAll

#Make backups of the databases.
FILE=website.db
if test -f "$FILE"; then
    cp website.db websiteBackup.db
    rm -rf website.db
fi
FILE=itemData.json
if test -f "$FILE"; then
    cp itemData.json itemDataBackup.json
    echo '{ "itemData": {} }' > itemData.json
fi
FILE=carts.json
if test -f "$FILE"; then
    cp carts.json cartsBackup.json
    echo '{ "carts": {} }' > carts.json
fi
FILE=discountCodes.json
if test -f "$FILE"; then
    cp discountCodes.json discountCodesBackup.json
    echo '{ "discountCodes": {"SAVE5": 5,"SAVE10": 10,"20OFF": 20} }' > discountCodes.json
fi
FILE=public/item_images
if test -d "$FILE"; then
    cp public/item_images public/item_images_backup -r
    rm -rf public/item_images
fi