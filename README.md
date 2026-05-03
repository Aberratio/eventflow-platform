# ZmierzymyCzas client

Frontend aplikacji ZmierzymyCzas zbudowany na Vite, React, TypeScript, shadcn/ui i Tailwind CSS.

## Uruchomienie

```sh
npm install
npm run dev
```

Domyslny serwer developerski dziala na porcie `8080`.

Konfiguracje srodowiska skopiuj z `.env.example` do lokalnego pliku `.env.local`.
Jesli chcesz laczyc frontend z lokalnym backendem, ustaw:

```sh
VITE_API_URL=http://localhost:8081/api/v1
```

Gdy `VITE_API_URL` jest ustawione, aplikacja korzysta z prawdziwego API. Jesli
backend zwraca 500 albo przegladarka pokazuje `connection refused`, najpierw
sprawdz:

```sh
curl http://localhost:8081/api/v1/health
curl http://localhost:8081/api/v1/events
```

Jesli `/health` dziala, ale `/events` zwraca blad SQL typu `Unknown column ...`,
lokalna baza ma stary schemat. W katalogu `zmierzymy_czas_server` uruchom:

```sh
composer migrate
```

Jesli `/health` tez nie odpowiada, backend nie jest uruchomiony. W katalogu
`zmierzymy_czas_server` odpal `composer serve` w osobnym terminalu i zostaw go
otwarty podczas pracy z frontendem.

Do pracy na mockach zostaw `VITE_API_URL` puste.

## Przydatne komendy

```sh
npm run typecheck
npm run lint
npm run test
npm run build
```
