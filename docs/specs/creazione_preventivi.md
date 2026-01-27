# Logica di Preventivazione AI

Il preventivo è una stima basata su categoria e urgenza. Il tecnico conferma il prezzo finale in loco.

## Matrice Prezzi Base (Esempi)

| Categoria | Tipo Intervento | Range Min (€) | Range Max (€) |
| :--- | :--- | :--- | :--- |
| **Idraulico** | Sblocco scarico semplice | 70 | 120 |
| **Idraulico** | Perdita importante / Tubo rotto | 100 | 250+ |
| **Elettrico** | Cambio presa / Interruttore | 60 | 90 |
| **Elettrico** | Corto circuito / Salvavita | 90 | 200 |
| **Fabbro** | Apertura porta (no scasso) | 80 | 150 |
| **Fabbro** | Cambio cilindro sicurezza | 120 | 250 |
| **Clima** | Manutenzione ordinaria | 70 | 100 |
| **Clima** | Guasto / Ricarica gas | 90 | 180 |
| **Tuttofare** | Montaggio mobile / Piccoli lavori | 50 | 100 |

## Regole di Output
1. Presentare sempre come "Stima Preliminare".
2. Aggiungere disclaimer: "Il prezzo finale verrà confermato dal tecnico dopo visione."
3. Non promettere mai "0€" o "Gratis".
