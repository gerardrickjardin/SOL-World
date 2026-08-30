from uszipcode import SearchEngine
search = SearchEngine()
res = search.by_population(lower=0, upper=999999999, returns=10)
print(f"Found {len(res)} zipcodes. First: {res[0].zipcode}, {res[0].state}, {res[0].population}")
