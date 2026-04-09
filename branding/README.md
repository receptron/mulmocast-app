# Branding

Place OEM branding JSON files in this directory and select them with the `BRAND` environment variable.

- `default.json` is the fallback branding and stays committed.
- `foobar.json` is a committed sample OEM file.
- Local OEM files such as `foo.json` are gitignored.
- `foo.ts` is also gitignored so ad-hoc local files do not leak into git, but the loader reads JSON.

Example:

```sh
BRAND=foo yarn start
BRAND=foo yarn make:local
```

Sample:

```sh
BRAND=foobar yarn start
```
