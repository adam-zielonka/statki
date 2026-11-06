# Statki

Klasyczna bitwa morska dla jednego gracza, z interfejsem PL/EN na komputer i telefon.
Jasny interfejs przypomina kartkę w kratkę: statki są bez wypełnienia,
obrysowane lekko nierówną kreską granatowego „długopisu”, a trafienia wyglądają jak ręcznie stawiane iksy. Po zatopieniu
iksy zostają, a cały statek wyróżnia wspólny obrys bez wypełnienia.
Odręczne nagłówki i kolorowe notatki uzupełniają papierowy styl.
Fonty Caveat i DM Sans są serwowane lokalnie; ich licencje SIL OFL znajdują się
w `public/fonts/`.
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

Plansza rywala jest widoczna od początku, a cztery kafelki wyboru leżą na jej kratce
i znikają po starcie. Na wąskiej planszy opis dotyczy wybranego przeciwnika.
Losowanie znajduje się przy nagłówku Twojej floty, a rozpoczęcie bitwy przy flocie rywala.
Odręczna elipsa wskazuje gracza wykonującego ruch. Po zakończeniu gry zwycięzca
otrzymuje zielony napis, a przy przegranej flocie pojawia się przycisk rewanżu.
Przyciski przy krawędziach nagłówka otwierają okna zasad i ustawień.
W ustawieniach wybierzesz tempo
rywala (spokojne, zwykłe lub szybkie), język, rozpoczniesz nową grę i otworzysz GitHub.
Otwarcie zasad lub ustawień nie przerywa rozgrywki. Nowa gra anuluje oczekujące
ruchy komputera. Planszę można obsługiwać klawiaturą: Tab, strzałki oraz Enter lub spacja.

See [DEVELOPMENT.md](DEVELOPMENT.md) for local setup and validation.


## Language / Język

The browser version supports Polish and English. On the first visit it uses the
first supported language from the browser’s preferences, falling back to English.
The English / Polski buttons in Settings save an explicit choice
in this application’s local storage.
Switching language preserves the current game. If storage is blocked, language switching
still works for the current visit.
