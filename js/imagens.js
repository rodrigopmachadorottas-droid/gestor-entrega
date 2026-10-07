/* Imagens (arquivos na pasta img/) */
const LOGOS={"preta": "img/logo-preta.png", "branca": "img/logo-branca.png", "rottas": "img/logo-rottas.png"};
const FOTOS={
"Meo Anita": "img/obras/meo-anita.jpg",
"Meo Hauer": "img/obras/meo-hauer.jpg",
"Meo Neoville": "img/obras/meo-neoville.jpg",
"Porto Aurora": "img/obras/porto-aurora.jpg",
"Porto Bella Vista": "img/obras/porto-bella-vista.jpg",
"Porto Blumen": "img/obras/porto-blumen.jpg",
"Porto Garten": "img/obras/porto-garten.jpg",
"Safira": "img/obras/safira.jpg",
"Door 7710": "img/obras/door-7710.jpg"
};
const fotoObra=o=>o.foto_url||FOTOS[o.nome]||"";
