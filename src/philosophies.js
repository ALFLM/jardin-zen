// Philosophical and zen-like thoughts for the gardener
export const philosophies = [
  "El jardín nos enseña paciencia.",
  "Cada línea en la arena es un pensamiento.",
  "La paz se cultiva, no se compra.",
  "El agua fluye, la arena espera.",
  "Lo importante no es el destino, sino el camino.",
  "El jardín respira con nosotros.",
  "En el silencio, escuchamos el universo.",
  "Cada piedra tiene una historia.",
  "Cuidar es amar.",
  "La naturaleza es el mejor maestro.",
  "La armonía nace del orden.",
  "El vacío lleno de posibilidades.",
  "Respirar es existir.",
  "El tiempo es una ilusión del jardín.",
  "La belleza está en la imperfección.",
]

export const getRandomPhilosophy = () => {
  return philosophies[Math.floor(Math.random() * philosophies.length)]
}
