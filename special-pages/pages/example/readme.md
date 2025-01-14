# Example Special Page

This example also serves as a template for new special pages.

## Creating a New Special Page

Special Page IDs must use kebab-case. For the examples below, we'll assume your new page is called `my-feature`. 

You may create a special page manually or using a shell script. See below for each method.

### Manual method

1. Duplicate the folder `/special-pages/pages/example` under the new page id `/special-pages/pages/my-feature`
2. Within the new folder, find and replace all occurrences of `example` with `my-feature`, and `Example` with `MyFeature`
3. Rename the translations file `./public/locales/en/example.json` to `my-feature.json`
4. Delete the type definitions file `./types/example.ts` -- it will be regenerated the next time you build the project
5. Update `./readme.md`
6. From the `special-pages` folder, run `npm run watch -- --page my-feature` to preview your new page at http://localhost:8000/

### Using create_special_page.sh

1. From the root folder, run `./scripts/create_special_page.sh my-feature`
2. From the `special-pages` folder, run `npm run watch -- --page my-feature` to preview your new page at http://localhost:8000/

## Integration

Serve the entire folder found under `build/<PLATFORM>/pages/example`

