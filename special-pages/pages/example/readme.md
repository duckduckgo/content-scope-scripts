# Example Special Page

This example also serves as a template for new special pages.

## Creating a New Special Page

Special Page IDs must use kebab-case. For the examples below, we'll assume your new page is called `my-feature`. 

You may create a special page manually or using a script. See below for each method.

### Manual method

1. Switch to the `special-pages` folder
2. Duplicate the folder `./pages/example` under the new page id `./pages/my-feature`
2. Within the new folder `./pages/my-feature`, find and replace all occurrences of `example` with `my-feature`, and `Example` with `MyFeature`
3. Rename the translations file `./public/locales/en/example.json` to `my-feature.json`
4. Delete the type definitions file `./types/example.ts` -- a new file will be generated the next time you build the project
5. Update `./readme.md`
6. From the `special-pages` folder, run `npm run watch -- --page my-feature` to preview your new page at http://localhost:8000/

### Scripted method

```sh
cd special-pages
npm run create -- my-feature
# Preview your new page at http://localhost:8000/
npm run watch -- --page my-feature 
```

## Integration

Serve the entire folder found under `build/<PLATFORM>/pages/example`

