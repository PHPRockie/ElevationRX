export interface Country {
  code: string
  name: string
  flag: string
}

export const COUNTRIES: Country[] = [
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷' },
  { code: 'AUS', name: 'Australia', flag: '🇦🇺' },
  { code: 'AUT', name: 'Austria', flag: '🇦🇹' },
  { code: 'BLR', name: 'Belarus', flag: '🇧🇾' },
  { code: 'BRA', name: 'Brazil', flag: '🇧🇷' },
  { code: 'CAN', name: 'Canada', flag: '🇨🇦' },
  { code: 'CHN', name: 'China', flag: '🇨🇳' },
  { code: 'COL', name: 'Colombia', flag: '🇨🇴' },
  { code: 'CUB', name: 'Cuba', flag: '🇨🇺' },
  { code: 'ESP', name: 'Spain', flag: '🇪🇸' },
  { code: 'FRA', name: 'France', flag: '🇫🇷' },
  { code: 'GBR', name: 'Great Britain', flag: '🇬🇧' },
  { code: 'GER', name: 'Germany', flag: '🇩🇪' },
  { code: 'GRE', name: 'Greece', flag: '🇬🇷' },
  { code: 'JPN', name: 'Japan', flag: '🇯🇵' },
  { code: 'KOR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'MEX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'NED', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'POR', name: 'Portugal', flag: '🇵🇹' },
  { code: 'RUS', name: 'Russia', flag: '🇷🇺' },
  { code: 'SUI', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'UKR', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'USA', name: 'United States', flag: '🇺🇸' },
  { code: 'UZB', name: 'Uzbekistan', flag: '🇺🇿' },
]

export function countryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code)
}
