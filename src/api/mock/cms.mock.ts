import type { InfoPage } from '@/types';

export const mockInfoPages: InfoPage[] = [
  {
    id: 'page-kontakt',
    title: 'Kontakt',
    slug: 'kontakt',
    icon: 'Mail',
    description: 'Skontaktuj się z zespołem ZmierzymyCzas - formularz kontaktowy i dane firmy',
    published: true,
    showInFooter: true,
    showInHeader: false,
    order: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2025-01-15T10:30:00Z',
    content: [
      {
        id: 's-kontakt-1',
        type: 'hero',
        title: 'Kontakt',
        content: 'Masz pytania? Chętnie pomożemy! Skontaktuj się z nami.',
      },
      {
        id: 's-kontakt-2',
        type: 'cards',
        title: 'Dane kontaktowe',
        items: [
          { id: 'c1', title: 'Email', description: 'kontakt@zmierzymyczas.pl', icon: 'Mail' },
          { id: 'c2', title: 'Telefon', description: '+48 123 456 789', icon: 'Phone' },
          {
            id: 'c3',
            title: 'Adres',
            description: 'ul. Sportowa 1, 00-001 Warszawa',
            icon: 'MapPin',
          },
          { id: 'c4', title: 'Godziny pracy', description: 'Pon-Pt: 9:00-17:00', icon: 'Clock' },
        ],
      },
      {
        id: 's-kontakt-3',
        type: 'text',
        title: 'Formularz kontaktowy',
        content:
          'Wypełnij formularz, a odpowiemy najszybciej jak to możliwe. Zazwyczaj odpowiadamy w ciągu 24 godzin roboczych.',
      },
    ],
  },
  {
    id: 'page-oferta',
    title: 'Oferta',
    slug: 'oferta',
    icon: 'Gift',
    description: 'Pakiety i cennik usług dla organizatorów wydarzeń sportowych',
    published: true,
    showInFooter: true,
    showInHeader: true,
    order: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2025-02-01T14:00:00Z',
    content: [
      {
        id: 's-oferta-1',
        type: 'hero',
        title: 'Oferta dla organizatorów',
        content: 'Kompleksowe rozwiązania do organizacji wydarzeń sportowych',
      },
      {
        id: 's-oferta-2',
        type: 'pricing',
        title: 'Pakiety',
        items: [
          {
            id: 'p1',
            title: 'Start',
            description: 'Dla małych wydarzeń do 100 uczestników',
            price: 0,
            features: [
              'Podstawowa strona wydarzenia',
              'Rejestracja online',
              'Lista startowa',
              'Wsparcie email',
            ],
          },
          {
            id: 'p2',
            title: 'Pro',
            description: 'Dla średnich wydarzeń do 500 uczestników',
            price: 299,
            features: [
              'Wszystko z Start',
              'Płatności online',
              'Kody rabatowe',
              'Merchandise',
              'Priorytetowe wsparcie',
            ],
          },
          {
            id: 'p3',
            title: 'Enterprise',
            description: 'Dla dużych wydarzeń bez limitów',
            price: 999,
            features: [
              'Wszystko z Pro',
              'Dedykowany opiekun',
              'Integracje API',
              'Live Results',
              'SLA 99.9%',
            ],
          },
        ],
      },
      {
        id: 's-oferta-3',
        type: 'cta',
        title: 'Gotowy na start?',
        content:
          'Skontaktuj się z nami i dowiedz się, jak możemy pomóc w organizacji Twojego wydarzenia.',
      },
    ],
  },
  {
    id: 'page-ubezpieczenia',
    title: 'Ubezpieczenia',
    slug: 'ubezpieczenia',
    icon: 'Shield',
    description: 'Ubezpieczenie NNW dla uczestników wydarzeń sportowych',
    published: true,
    showInFooter: true,
    showInHeader: false,
    order: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2025-01-20T09:00:00Z',
    content: [
      {
        id: 's-ubezp-1',
        type: 'hero',
        title: 'Ubezpieczenia sportowe',
        content: 'Kompleksowa ochrona dla uczestników wydarzeń sportowych',
      },
      {
        id: 's-ubezp-2',
        type: 'cards',
        title: 'Co obejmuje ubezpieczenie?',
        items: [
          {
            id: 'u1',
            title: 'NNW',
            description: 'Następstwa nieszczęśliwych wypadków do 50 000 zł',
            icon: 'Shield',
          },
          {
            id: 'u2',
            title: 'Koszty leczenia',
            description: 'Pokrycie kosztów leczenia do 10 000 zł',
            icon: 'Heart',
          },
          {
            id: 'u3',
            title: 'Assistance',
            description: 'Pomoc medyczna i transport',
            icon: 'Phone',
          },
          {
            id: 'u4',
            title: 'Sprzęt',
            description: 'Ubezpieczenie sprzętu sportowego',
            icon: 'Package',
          },
        ],
      },
      {
        id: 's-ubezp-3',
        type: 'faq',
        title: 'Najczęstsze pytania',
        items: [
          {
            id: 'f1',
            title: 'Jak wykupić ubezpieczenie?',
            description:
              'Ubezpieczenie możesz wykupić podczas rejestracji na wydarzenie. Opcja jest dostępna jeśli organizator ją włączył.',
          },
          {
            id: 'f2',
            title: 'Czy ubezpieczenie jest obowiązkowe?',
            description:
              'To zależy od organizatora. Niektóre wydarzenia wymagają ubezpieczenia, inne oferują je opcjonalnie.',
          },
          {
            id: 'f3',
            title: 'Jak zgłosić szkodę?',
            description:
              'W przypadku wypadku skontaktuj się z nami przez formularz kontaktowy lub telefon. Pomożemy w zgłoszeniu szkody.',
          },
        ],
      },
    ],
  },
  {
    id: 'page-o-nas',
    title: 'O nas',
    slug: 'o-nas',
    icon: 'Users',
    description:
      'Poznaj historię i zespół ZmierzymyCzas - platformy do organizacji wydarzeń sportowych',
    published: true,
    showInFooter: true,
    showInHeader: true,
    order: 4,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2025-01-25T16:00:00Z',
    content: [
      {
        id: 's-onas-1',
        type: 'hero',
        title: 'O nas',
        content: 'Tworzymy technologię, która łączy sportowców',
      },
      {
        id: 's-onas-2',
        type: 'stats',
        title: 'ZmierzymyCzas w liczbach',
        items: [
          { id: 's1', title: '500+', description: 'Wydarzeń' },
          { id: 's2', title: '150 000+', description: 'Uczestników' },
          { id: 's3', title: '200+', description: 'Organizatorów' },
          { id: 's4', title: '50+', description: 'Miast' },
        ],
      },
      {
        id: 's-onas-3',
        type: 'text',
        title: 'Nasza historia',
        content:
          'ZmierzymyCzas powstał w 2016 roku z pasji do sportu i technologii. Założyciele - sami aktywni sportowcy - dostrzegli potrzebę stworzenia nowoczesnej platformy łączącej organizatorów z uczestnikami.\n\nOd tego czasu nieprzerwanie rozwijamy naszą platformę, dodając nowe funkcje i usprawnienia. Współpracujemy z największymi organizatorami wydarzeń sportowych w Polsce.\n\nNaszą misją jest ułatwianie organizacji i uczestnictwa w wydarzeniach sportowych. Wierzymy, że sport łączy ludzi i chcemy być częścią tej społeczności.',
      },
      {
        id: 's-onas-4',
        type: 'team',
        title: 'Nasz zespół',
        items: [
          {
            id: 't1',
            title: 'Marek Kowalski',
            description: 'CEO & Founder',
            image: 'https://i.pravatar.cc/150?u=marek',
          },
          {
            id: 't2',
            title: 'Anna Nowak',
            description: 'CTO',
            image: 'https://i.pravatar.cc/150?u=anna',
          },
          {
            id: 't3',
            title: 'Piotr Wiśniewski',
            description: 'Head of Sales',
            image: 'https://i.pravatar.cc/150?u=piotr',
          },
          {
            id: 't4',
            title: 'Katarzyna Biegacz',
            description: 'Customer Success',
            image: 'https://i.pravatar.cc/150?u=kasia',
          },
        ],
      },
      {
        id: 's-onas-5',
        type: 'cta',
        title: 'Dołącz do nas!',
        content: 'Szukamy utalentowanych osób, które chcą zmieniać świat sportu.',
      },
    ],
  },
  {
    id: 'page-faq',
    title: 'FAQ',
    slug: 'faq',
    icon: 'HelpCircle',
    description: 'Najczęściej zadawane pytania dotyczące platformy ZmierzymyCzas',
    published: true,
    showInFooter: true,
    showInHeader: false,
    order: 5,
    createdAt: '2025-01-20T00:00:00Z',
    updatedAt: '2025-01-20T00:00:00Z',
    content: [
      {
        id: 's-faq-1',
        type: 'hero',
        title: 'Często zadawane pytania',
        content: 'Znajdź odpowiedzi na najczęściej zadawane pytania',
      },
      {
        id: 's-faq-2',
        type: 'faq',
        title: 'Rejestracja i uczestnictwo',
        items: [
          {
            id: 'faq1',
            title: 'Jak się zarejestrować na zawody?',
            description:
              'Wejdź na stronę wydarzenia, wybierz dystans i wypełnij formularz rejestracyjny. Po opłaceniu wpisowego otrzymasz potwierdzenie na email.',
          },
          {
            id: 'faq2',
            title: 'Jak sprawdzić swoje wyniki?',
            description:
              'Po zakończeniu zawodów wyniki są publikowane na stronie wydarzenia w zakładce "Wyniki". Możesz też sprawdzić swoje wszystkie wyniki w profilu uczestnika.',
          },
          {
            id: 'faq3',
            title: 'Czy mogę zrezygnować z udziału?',
            description:
              'Zasady rezygnacji określa organizator. Zazwyczaj jest możliwy zwrot części opłaty lub przeniesienie na inną osobę.',
          },
          {
            id: 'faq4',
            title: 'Jak odebrać pakiet startowy?',
            description:
              'Informacje o miejscu i czasie odbioru pakietu znajdziesz na stronie wydarzenia. Zazwyczaj pakiety są wydawane dzień przed lub w dniu zawodów.',
          },
        ],
      },
      {
        id: 's-faq-3',
        type: 'faq',
        title: 'Płatności',
        items: [
          {
            id: 'faq5',
            title: 'Jakie metody płatności są dostępne?',
            description:
              'Akceptujemy przelewy bankowe, BLIK, karty płatnicze oraz płatności przez PayU. Dostępność metod zależy od ustawień organizatora.',
          },
          {
            id: 'faq6',
            title: 'Kiedy otrzymam fakturę?',
            description:
              'Faktura jest wysyłana automatycznie na podany email po zaksięgowaniu płatności.',
          },
        ],
      },
    ],
  },
  {
    id: 'page-regulamin',
    title: 'Regulamin',
    slug: 'regulamin',
    icon: 'FileText',
    description: 'Regulamin korzystania z platformy ZmierzymyCzas',
    published: true,
    showInFooter: true,
    showInHeader: false,
    order: 6,
    createdAt: '2025-01-25T00:00:00Z',
    updatedAt: '2025-01-25T00:00:00Z',
    content: [
      {
        id: 's-reg-1',
        type: 'hero',
        title: 'Regulamin platformy',
        content: 'Zasady korzystania z serwisu ZmierzymyCzas',
      },
      {
        id: 's-reg-2',
        type: 'text',
        title: '§1 Postanowienia ogólne',
        content:
          'Niniejszy regulamin określa zasady korzystania z platformy ZmierzymyCzas. Korzystając z serwisu, akceptujesz poniższe warunki.\n\nPlatforma ZmierzymyCzas jest własnością ZmierzymyCzas Sp. z o.o. z siedzibą w Warszawie przy ul. Sportowej 1.',
      },
      {
        id: 's-reg-3',
        type: 'text',
        title: '§2 Definicje',
        content:
          'Użytkownik - osoba korzystająca z platformy\nOrganizator - podmiot organizujący wydarzenia sportowe\nUczestnik - osoba biorąca udział w wydarzeniach\nUsługa - funkcjonalności udostępniane przez platformę',
      },
    ],
  },
  {
    id: 'page-polityka-prywatnosci',
    title: 'Polityka prywatności',
    slug: 'polityka-prywatnosci',
    icon: 'FileText',
    description: 'Polityka prywatności platformy ZmierzymyCzas',
    published: true,
    showInFooter: false,
    showInHeader: false,
    order: 7,
    createdAt: '2025-01-25T00:00:00Z',
    updatedAt: '2025-01-25T00:00:00Z',
    content: [
      {
        id: 's-priv-1',
        type: 'hero',
        title: 'Polityka prywatności',
        content: 'Informacje o przetwarzaniu danych osobowych oraz wykorzystaniu plików cookies',
      },
      {
        id: 's-priv-2',
        type: 'text',
        title: 'Administrator danych',
        content:
          'Administratorem danych osobowych jest ZmierzymyCzas Sp. z o.o. z siedzibą w Warszawie przy ul. Sportowej 1, 00-001 Warszawa, wpisana do rejestru przedsiębiorców KRS pod numerem 0000123456.\n\nKontakt z Inspektorem Ochrony Danych: iod@zmierzymyczas.pl',
      },
      {
        id: 's-priv-3',
        type: 'text',
        title: 'Cele przetwarzania danych',
        content:
          'Dane osobowe przetwarzamy w następujących celach:\n\n• Rejestracja i obsługa konta użytkownika (art. 6 ust. 1 lit. b RODO)\n• Rejestracja na wydarzenia sportowe i publikacja wyników zawodów (art. 6 ust. 1 lit. b RODO)\n• Komunikacja z użytkownikami (art. 6 ust. 1 lit. f RODO)\n• Marketing własnych usług – wyłącznie za zgodą użytkownika (art. 6 ust. 1 lit. a RODO)\n• Realizacja obowiązków prawnych, np. podatkowych (art. 6 ust. 1 lit. c RODO)\n• Dochodzenie i obrona roszczeń (art. 6 ust. 1 lit. f RODO)',
      },
      {
        id: 's-priv-4',
        type: 'text',
        title: 'Prawa użytkownika (RODO)',
        content:
          'Na podstawie RODO przysługują Ci następujące prawa:\n\n• **Prawo dostępu** – możesz uzyskać informację, jakie dane przetwarzamy i w jakim celu\n• **Prawo do sprostowania** – możesz poprawić nieprawidłowe lub niekompletne dane\n• **Prawo do usunięcia** („prawo do bycia zapomnianym") – możesz zażądać usunięcia swoich danych\n• **Prawo do ograniczenia przetwarzania** – możesz ograniczyć sposób wykorzystania danych\n• **Prawo do przenoszenia danych** – możesz otrzymać dane w ustrukturyzowanym formacie\n• **Prawo do sprzeciwu** – możesz sprzeciwić się przetwarzaniu opartemu na prawnie uzasadnionym interesie\n• **Prawo do cofnięcia zgody** – w dowolnym momencie, bez wpływu na zgodność z prawem wcześniejszego przetwarzania\n\nAby skorzystać z tych praw, skontaktuj się z nami: dane@zmierzymyczas.pl lub przez formularz kontaktowy.',
      },
      {
        id: 's-priv-5',
        type: 'text',
        title: 'Pliki cookies',
        content:
          'Nasza strona wykorzystuje pliki cookies (ciasteczka) w celu zapewnienia prawidłowego działania serwisu, analizy ruchu oraz personalizacji treści.\n\n**Rodzaje plików cookies:**\n\n• **Niezbędne** – konieczne do działania strony (sesja, koszyk, logowanie). Nie wymagają zgody.\n• **Analityczne** – pozwalają analizować ruch na stronie i poprawiać jej działanie (np. Google Analytics). Wymagają zgody.\n• **Marketingowe** – służą do wyświetlania spersonalizowanych reklam i remarketingu. Wymagają zgody.\n• **Funkcjonalne** – umożliwiają zapamiętanie preferencji użytkownika (język, motyw). Wymagają zgody.\n\nPrzy pierwszej wizycie na stronie wyświetlamy baner z możliwością wyboru kategorii cookies. Swoje preferencje możesz zmienić w dowolnym momencie klikając „Ustawienia cookies" w stopce strony.',
      },
      {
        id: 's-priv-6',
        type: 'text',
        title: 'Okres przechowywania danych',
        content:
          '• Dane konta użytkownika – przez okres aktywności konta oraz 5 lat po jego usunięciu\n• Dane rejestracji na wydarzenia – przez 5 lat od daty wydarzenia\n• Wyniki sportowe – bezterminowo (uzasadniony interes – archiwum wyników)\n• Dane rozliczeniowe – przez 5 lat zgodnie z przepisami podatkowymi\n• Pliki cookies – od 1 dnia do 2 lat w zależności od typu',
      },
      {
        id: 's-priv-7',
        type: 'text',
        title: 'Udostępnianie danych',
        content:
          'Dane osobowe mogą być udostępniane:\n\n• Organizatorom wydarzeń, na które się rejestrujesz (imię, nazwisko, dane kontaktowe, wyniki)\n• Podmiotom przetwarzającym dane w naszym imieniu: hosting (OVH), płatności (Stripe), analityka (Google)\n• Organom publicznym – wyłącznie na podstawie obowiązujących przepisów prawa\n\nNie przekazujemy danych do państw trzecich spoza EOG bez odpowiednich zabezpieczeń.',
      },
      {
        id: 's-priv-8',
        type: 'faq',
        title: 'Najczęstsze pytania o prywatność',
        items: [
          {
            id: 'pf1',
            title: 'Jak długo przechowujecie moje dane?',
            description:
              'Dane przechowujemy przez okres korzystania z konta oraz 5 lat po jego usunięciu w celach archiwizacyjnych i prawnych.',
          },
          {
            id: 'pf2',
            title: 'Czy mogę usunąć swoje dane?',
            description:
              'Tak, masz prawo do usunięcia swoich danych. Skontaktuj się z nami przez formularz kontaktowy lub wyślij email na adres dane@zmierzymyczas.pl.',
          },
          {
            id: 'pf3',
            title: 'Czy udostępniacie dane podmiotom trzecim?',
            description:
              'Dane udostępniamy wyłącznie organizatorom wydarzeń, na które się rejestrujesz, oraz podmiotom przetwarzającym dane w naszym imieniu (hosting, płatności).',
          },
          {
            id: 'pf4',
            title: 'Jak zmienić ustawienia cookies?',
            description:
              'Kliknij „Ustawienia cookies" w stopce strony. Możesz tam włączyć lub wyłączyć poszczególne kategorie plików cookies w dowolnym momencie.',
          },
          {
            id: 'pf5',
            title: 'Gdzie mogę złożyć skargę?',
            description:
              'Masz prawo złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa), jeśli uważasz, że przetwarzanie Twoich danych narusza przepisy RODO.',
          },
        ],
      },
    ],
  },
  {
    id: 'page-rodo',
    title: 'RODO',
    slug: 'rodo',
    icon: 'Shield',
    description: 'Informacje o prawach użytkownika wynikających z RODO',
    published: true,
    showInFooter: false,
    showInHeader: false,
    order: 8,
    createdAt: '2025-01-25T00:00:00Z',
    updatedAt: '2025-01-25T00:00:00Z',
    content: [
      {
        id: 's-rodo-1',
        type: 'hero',
        title: 'RODO – Twoje prawa',
        content: 'Informacje o ochronie danych osobowych zgodnie z Rozporządzeniem RODO',
      },
      {
        id: 's-rodo-2',
        type: 'text',
        title: 'Czym jest RODO?',
        content:
          'RODO (Rozporządzenie o Ochronie Danych Osobowych) to unijne rozporządzenie, które reguluje zasady przetwarzania danych osobowych. Zapewnia Ci szereg praw dotyczących Twoich danych osobowych.',
      },
      {
        id: 's-rodo-3',
        type: 'cards',
        title: 'Twoje prawa',
        items: [
          {
            id: 'r1',
            title: 'Prawo dostępu',
            description: 'Masz prawo wiedzieć, jakie dane o Tobie posiadamy i jak je przetwarzamy.',
            icon: 'Eye',
          },
          {
            id: 'r2',
            title: 'Prawo do sprostowania',
            description: 'Możesz żądać poprawienia nieprawidłowych lub niekompletnych danych.',
            icon: 'Edit',
          },
          {
            id: 'r3',
            title: 'Prawo do usunięcia',
            description:
              'Możesz żądać usunięcia swoich danych osobowych ("prawo do bycia zapomnianym").',
            icon: 'Trash2',
          },
          {
            id: 'r4',
            title: 'Prawo do przenoszenia',
            description:
              'Masz prawo otrzymać swoje dane w formacie nadającym się do odczytu maszynowego.',
            icon: 'Download',
          },
        ],
      },
      {
        id: 's-rodo-4',
        type: 'text',
        title: 'Jak skorzystać ze swoich praw?',
        content:
          'Aby skorzystać z przysługujących Ci praw, skontaktuj się z naszym Inspektorem Ochrony Danych:\n\n• Email: iod@zmierzymyczas.pl\n• Adres: ul. Sportowa 1, 00-001 Warszawa\n\nNa Twoje żądanie odpowiemy w ciągu 30 dni.',
      },
    ],
  },
];
