# domqs - DOM Query Selector

Easy DOM scraping.

```
import q from 'domqs'

const scrape = q([".athing"], {
    "title": ".storylink",
    "link": ".storylink@href",
    "score": q(".score", Number)
})

console.log(scrape("..."))
```
