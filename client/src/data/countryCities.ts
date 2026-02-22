import { Country, State, City, ICountry, IState, ICity } from 'country-state-city';

// Convert ISO country code to flag emoji
export function countryCodeToFlag(isoCode: string): string {
    return isoCode
        .toUpperCase()
        .split('')
        .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
        .join('');
}

// Get all countries with flags
export function getCountries(): (ICountry & { flag: string })[] {
    return Country.getAllCountries().map((c) => ({
        ...c,
        flag: countryCodeToFlag(c.isoCode),
    }));
}

// Get states/provinces for a country
export function getStatesForCountry(countryCode: string): IState[] {
    return State.getStatesOfCountry(countryCode);
}

// Get cities for a country (optionally filtered by state)
export function getCitiesForCountry(countryCode: string, stateCode?: string): ICity[] {
    if (stateCode) {
        return City.getCitiesOfState(countryCode, stateCode);
    }
    return City.getCitiesOfCountry(countryCode) || [];
}
