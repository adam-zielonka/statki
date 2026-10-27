# Statki

Klasyczna bitwa morska dla jednego gracza, z polskim interfejsem na komputer i telefon.
Przed startem wybierz przeciwnika i wylosuj swoją flotę. Trafienie daje kolejny strzał,
a pudło przekazuje turę. Statki nie stykają się, również po przekątnej.
Woda wokół zatopionego statku jest oznaczana automatycznie.

## Przeciwnicy

- **Felek — odkrywca:** losuje nieodkryte pola.
- **Hugo — łowca:** po trafieniu bada sąsiednie pola i kontynuuje linię statku.
- **Ada — strategini:** łączy pościg za trafionym statkiem z przeszukiwaniem w szachownicę;
  po zatopieniu wszystkich większych statków przeszukuje pozostałe pola.
- **Lena — nawigatorka:** zlicza legalne położenia pozostałych statków i wybiera pola
  o największej liczbie pasujących układów; po trafieniu skupia się na dobiciu statku.

Każdy przeciwnik otrzymuje wyłącznie wyniki dotychczasowych strzałów oraz rozmiary
pozostałych statków. Ukryte położenia floty nie są przekazywane algorytmom.

Dostępne są pauza, rewanż, licznik floty, historia strzałów i podsumowanie celności.
Pauza i nowa gra anulują oczekujące ruchy komputera. Planszę można obsługiwać
klawiaturą: Tab, strzałki oraz Enter lub spacja.

See [DEVELOPMENT.md](DEVELOPMENT.md) for local setup and validation.
