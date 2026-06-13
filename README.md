# ZmierzymyCzas client

Frontend aplikacji ZmierzymyCzas zbudowany na Vite, React, TypeScript, shadcn/ui i Tailwind CSS.

## Uruchomienie

```sh
npm install
npm run dev
```

Domyslny serwer developerski dziala na porcie `8080`.

Frontend domyslnie laczy sie z lokalnym backendem pod adresem
`http://localhost:8081/api/v1`. Jesli backend dziala pod innym adresem, ustaw
w `.env.local`:

```sh
VITE_API_URL=http://localhost:8081/api/v1
```

Jesli backend zwraca 500 albo przegladarka pokazuje `connection refused`,
najpierw sprawdz:

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

Mock adapter zostal w kodzie tylko dla testow i nie jest domyslna sciezka aplikacji.

## Przydatne komendy

```sh
npm run typecheck
npm run lint
npm run test
npm run build
```
