#!/usr/bin/env bash

set -e
echo beforeEach
#Delete the database files.
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