# Rozróżnienie trafienia i zatopienia — 2026-10-29 UTC

Źródła obrazów: commit `c7e7090f7a6a65cceefa39575882dc5fe0f92a99`.
Pakiet nie deklaruje numeru wersji. Scenariusz i obrazy są syntetyczne,
bez danych prywatnych. Chromium 156.0.8078.4, deviceScaleFactor 1,
jedyny istniejący motyw ciemny. Bez zmian reguł, AI i timerów gry.

- `desktop-{color,grayscale}.png`: viewport 1280×1000, klawiatura Enter/Space.
- `phone-{color,grayscale}.png`: viewport 390×844, isMobile/hasTouch, tap.
- Obie wersje pokazują pełną stronę po przewinięciu na górę, bez zmiany
  pozycjonowania elementów. Pozwala to zobaczyć obie plansze i legendę bez
  nałożenia istniejącego przyklejonego paska sterowania.
- Kolor i `filter: grayscale(1)` na `html`, ten sam stan gry. To symulacja CSS,
  nie test fizycznego panelu monochromatycznego ani pełny audyt WCAG.

## Scenariusz i wynik

LCG `seed=117`, krok `(Math.imul(seed,1664525)+1013904223)>>>0`,
`Math.random=seed/2**32`; przeciwnik Felek (`random`). Zachowane natywne
`Window.setTimeout/clearTimeout` i opóźnienie 650 ms. Gracz wybiera kolejne
pierwsze legalne pole. Obrazy: po 15 strzałach gracza i powrocie jego tury.
Na obu planszach są jednocześnie `·` pudło, `×` trafienie i `■` zatopienie.

Pełna rozgrywka na obu urządzeniach: zwycięstwo po 64 strzałach, wszystkie
20 pól statków przeciwnika oznaczone `■`. W każdej grze 63 kontrole ukrycia
floty przed końcem; nieodkryte pola przeciwnika nie mają znaku ani klasy
ujawnionego statku. Po końcu ocalała własna flota pozostaje widoczna.
Pauza/wznowienie, PL→EN→PL bez zmiany stanu oraz nowa gra sprawdzone.
Brak błędów JS i poziomego przepełnienia przy szerokościach 320, 390, 768,
1280 i 1440 px.

Odrębne regresje przeglądarkowe obserwują rzeczywiste przejścia trafionych pól
w zatopione na obu planszach, także gdy zmiana następuje w obrębie jednej tury
AI. Grają do zatopienia wielomasztowca; pierwsze 15 strzałów zawiera jedynie
zatopione jednomasztowce i samo nie dowodzi przejścia `hit`→`sunk`.

## Kontrast i kontrole

Z rzeczywistych kolorów `getComputedStyle` i luminancji względnej sRGB:

| Element | Kolor | Po CSS grayscale |
| --- | ---: | ---: |
| `×` na polu / w legendzie | 5,21:1 | 5,39:1 |
| `■` na polu / w legendzie | 5,19:1 | 5,09:1 |
| Tekst legendy — konserwatywne minimum | 7,26:1 | 7,35:1 |

Tekst legendy `#9fb4c0` porównano z najjaśniejszym możliwym tłem gradientu
`#18344266` złożonym na bazie `#0b1c29` (`#102632`). Pola i próbki legendy
mają nieprzezroczyste tła. Współczynniki grayscale sRGB:
0,2126 / 0,7152 / 0,0722. Znak zatopienia w próbce legendy ma 12 px w 13×13 px;
na planszy 24 px desktop / 23 px telefon. Kształt nie zależy od obrysu
ostatniego strzału ani focusu. Nazwy i wyniki tekstowe PL/EN zachowane.

Kontrole przed publikacją: lint, 20/20 testów jednostkowych, build,
audit high bez podatności oraz 10/10 testów Playwright z natywnymi timerami.
Po końcowym dopasowaniu rozmiaru legendy ponowny build i pełny render seed117
na obu urządzeniach PASS. Odbiór wymaga także rzeczywistego push i wdrożenia
Pages dla finalnego SHA oraz niezależnego review w zadaniu
[server-knowledge#27](https://github.com/adam-zielonka/server-knowledge/issues/27).
