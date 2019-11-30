#!/usr/bin/env bash

set -e
echo afterAll
#Delete the databases that were used for the acceptance testing.
FILE=website.db
if test -f "$FILE"; then
    rm -rf website.db
fi
FILE=itemData.json
if test -f "$FILE"; then
   echo '{ "itemData": {} }' > itemData.json
fi
FILE=carts.json
if test -f "$FILE"; then
   echo '{ "carts": {} }' > carts.json
fi
FILE=discountCodes.json
if test -f "$FILE"; then
   echo '{ "discountCodes": {"SAVE5": 5,"SAVE10": 10,"20OFF": 20} }' > discountCodes.json
fi
FILE=public/item_images
if test -d "$FILE"; then
    rm -rf public/item_images
fi
#Restore the databases from before the acceptance tests were run, and delete the backups.
FILE=websiteBackup.db
if test -f "$FILE"; then
    cp websiteBackup.db website.db
    rm -rf websiteBackup.db
fi
FILE=itemDataBackup.json
if test -f "$FILE"; then
    cp itemDataBackup.json itemData.json
    rm -rf itemDataBackup.json
fi
FILE=cartsBackup.json
if test -f "$FILE"; then
    cp cartsBackup.json carts.json
    rm -rf cartsBackup.json
fi
FILE=discountCodesBackup.json
if test -f "$FILE"; then
    cp discountCodesBackup.json discountCodes.json
    rm -rf discountCodesBackup.json
fi
FILE=public/item_images_backup
if test -d "$FILE"; then
    cp public/item_images_backup public/item_images -r
    rm -rf public/item_images_backup
fi