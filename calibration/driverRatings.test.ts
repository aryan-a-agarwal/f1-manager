import assert from "node:assert/strict";
import {calculateDriverRatings} from "../lib/driverRatings";

const driver = Object.fromEntries(["pace","qualifying","racecraft","consistency","overtaking","defending","wet_weather_ability","tyre_management","tyre_warm_up_ability","temperature_control","battery_management","reliability","team_orders_understanding","braking","cornering","reactions","smoothness","adaptability"].map(key=>[key,80])) as Record<string,number>;
driver.incident_proneness=20;
driver.development_rate=100;
assert.deepEqual(calculateDriverRatings(driver,"2007-01-04","2027-01-04"),{overall:80,potential:96});
assert.deepEqual(calculateDriverRatings(driver,"2003-01-04","2027-01-04"),{overall:80,potential:91});
assert.deepEqual(calculateDriverRatings(driver,"1990-01-04","2027-01-04"),{overall:80,potential:80});
assert.deepEqual(calculateDriverRatings(driver,null,"2027-01-04"),{overall:80,potential:null});
assert.deepEqual(calculateDriverRatings({...driver,pace:null},"2007-01-04","2027-01-04"),{overall:null,potential:null});
assert.deepEqual(calculateDriverRatings({...driver,current_overall_rating:5,potential_rating:5},"2007-01-04","2027-01-04"),{overall:80,potential:96});
assert.equal(calculateDriverRatings(driver,"2007-02-30","2027-01-04").potential,null);
console.log("Driver rating calculation tests passed");
