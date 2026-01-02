const setupPalette = (index) => {
  const grassPalettes = []
  const flowerPalettes = []
  const leafPalettes = []
  const riverPalettes = []
  const bgs = []
  const penPalettes = []
  const beePalettes = []
  const ladyPalettes = []
  const mothPalettes = []
  const names = []

  // 0
  names.push(`del valle`)
  bgs.push('#F3F1F1')
  penPalettes.push('#502F2F')
  flowerPalettes.push([
    '#D02A11',
    '#B0891C',
    '#C9BA31',
    '#DE9B35',
    '#FA9D57',
    '#DAE6A2',
    '#F6E128',
    '#FBEBAD',
    '#D2FED2',
    '#FAC7FF',
  ])
  leafPalettes.push(['#307358', '#307337', '#4D7330'])
  grassPalettes.push(['#539379', '#509156', '#6D9451'])
  riverPalettes.push(
    [
      '#4577A6',
      '#487CAD',
      '#4B81B4',
      '#4B88C1',
      '#4B8ECE',
      '#73A7D9',
    ].reverse(),
  )
  beePalettes.push({
    body: '#F5DF19',
    stripes: '#1D1B07',
    wings: '#1D1B07',
  })
  ladyPalettes.push({
    body: '#ED1212',
    dots: '#1D1B07',
  })
  mothPalettes.push({
    body: '#F5A14D',
    wings: '#6B5505',
  })

  // 1
  names.push(`reyna`)
  bgs.push('#EDE5E3')
  penPalettes.push('#2A3428')
  flowerPalettes.push([
    '#B8476F',
    '#9C55AA',
    '#AF31AB',
    '#AB91C0',
    '#AC84D2',
    '#71AFD0',
    '#78CEAD',
    '#9AD2CB',
    '#FFE74D',
    '#DBFFFB',
  ])
  leafPalettes.push(['#767B4C', '#7C8628', '#9FA351'])
  grassPalettes.push(['#838B3C', '#87931B', '#ACB143'])
  riverPalettes.push(
    [
      '#7C9598',
      '#7F989A',
      '#819A9C',
      '#879EA1',
      '#8CA4A6',
      '#8FA6A8',
    ].reverse(),
  )
  beePalettes.push({
    body: '#E4BA3F',
    stripes: '#252509',
    wings: '#252509',
  })
  ladyPalettes.push({
    body: '#E85E5E',
    dots: '#252509',
  })
  mothPalettes.push({
    body: '#1D8C58',
    wings: '#314611',
  })

  // 2
  names.push(`morelia`)
  bgs.push('#EFF4E6')
  penPalettes.push('#1E1515')
  flowerPalettes.push([
    '#FAF9FA',
    '#FDC3ED',
    '#FFCCDB',
    '#FFC2A3',
    '#FBD898',
    '#FF9752',
    '#73A0FD',
    '#F9941F',
    '#336DFF',
    '#0D46F2',
  ])
  leafPalettes.push(['#1B3969', '#406D72', '#7AA668', '#6D8C54'])
  grassPalettes.push(['#1B3969', '#406D72', '#7AA668', '#6D8C54'])
  riverPalettes.push([
    '#90BBDA',
    '#8CCFDE',
    '#93D2DC',
    '#A3DCCD',
    '#BAD8E3',
    '#BFC3E8',
    '#D0DAF1',
    '#CCDBE0',
  ])
  beePalettes.push({
    body: '#F5C619',
    stripes: '#250A09',
    wings: '#250A09',
  })
  ladyPalettes.push({
    body: '#FFDE4D',
    dots: '#2C2902',
  })
  mothPalettes.push({
    body: '#BF3160',
    wings: '#47102D',
  })

  // 3
  names.push(`natalia`)
  bgs.push('#001A01')
  penPalettes.push('#F0F6EE')
  flowerPalettes.push([
    '#FFE8A9',
    '#FDFE02',
    '#ADE21D',
    '#17EEC6',
    '#011EFE',
    '#9332FB',
    '#FE00F6',
    '#FE0000',
    '#FE8585',
  ])
  leafPalettes.push(['#0BFF01', '#66FF61', '#A1FF9E', '#07C700'])
  grassPalettes.push(['#0BFF01', '#66FF61', '#A1FF9E', '#07C700'])
  riverPalettes.push([
    '#3778CD',
    '#2D90D7',
    '#1FC4E5',
    '#28D4F6',
    '#4DEEEA',
    '#28F6F3',
  ])
  beePalettes.push({
    body: '#FEBA01',
    stripes: '#FBFDE7',
    wings: '#FBFDE7',
  })
  ladyPalettes.push({
    body: '#6300CC',
    dots: '#E7E8F3',
  })
  mothPalettes.push({
    body: '#55CC00',
    wings: '#E0FAE9',
  })

  // 4
  names.push(`urandén`)
  bgs.push('#121317')
  penPalettes.push('#FFEDB8')
  flowerPalettes.push([
    '#C8A979',
    '#8BD094',
    '#856FE7',
    '#B71F1F',
    '#750DC9',
    '#2A3ED5',
    '#24A2C2',
  ])
  leafPalettes.push(['#8D6693', '#9F7BA7', '#96698A', '#6C4077'])
  grassPalettes.push(['#8D6693', '#9F7BA7', '#96698A', '#6C4077'])
  riverPalettes.push([
    '#B5C9C9',
    '#ADC2C2',
    '#B1C3C4',
    '#A4B6B6',
    '#9CB3B4',
    '#8EADAF',
  ])
  beePalettes.push({
    body: '#E4BEDE',
    stripes: '#B64A02',
    wings: '#B64A02',
  })
  ladyPalettes.push({
    body: '#EFE78A',
    dots: '#4D9900',
  })
  mothPalettes.push({
    body: '#4AC610',
    wings: '#C69010',
  })

  // 5
  names.push(`pátzcuaro`)
  bgs.push('#1C1008')
  penPalettes.push('#CC9600')
  flowerPalettes.push([
    '#F4CA85',
    '#F6A651',
    '#E37D7D',
    '#7F68F3',
    '#C256B6',
    '#EA7676',
    '#C338FF',
    '#6260EB',
  ])
  leafPalettes.push(['#F6CBEF', '#FBBCDD', '#FBC6E7'])
  grassPalettes.push(['#FFB3F2', '#FFA8D4', '#FFB8E4'])
  riverPalettes.push(['#8C8FC0', '#889EC3', '#9299D9', '#99ABDB', '#95B6DB'])
  beePalettes.push({
    body: '#FF751F',
    stripes: '#FFEF94',
    wings: '#FFEF94',
  })
  ladyPalettes.push({
    body: '#FFADEB',
    dots: '#C2001A',
  })
  mothPalettes.push({
    body: '#F000BC',
    wings: '#BE2EE5',
  })

  // 6
  names.push(`michoacán`)
  bgs.push('#039156')
  penPalettes.push('#500246')
  flowerPalettes.push(
    [
      '#D3E3DD',
      '#BBD3C9',
      '#86B19F',
      '#70A48E',
      '#619480',
      '#537F6D',
    ].reverse(),
  )
  leafPalettes.push(['#2A4137', '#1E2E28', '#121C18'])
  grassPalettes.push(['#446959', '#4D7566', '#3A5A4D'])
  riverPalettes.push(['#90B181', '#91B28A', '#ABC9AF', '#C3DAC3', '#D5E5D2'])
  beePalettes.push({
    body: '#00B398',
    stripes: '#2CE8CB',
    wings: '#2CE8CB',
  })
  ladyPalettes.push({
    body: '#00C7D1',
    dots: '#DBDBDB',
  })
  mothPalettes.push({
    body: '#0065D1',
    wings: '#0079FA',
  })

  // 7
  names.push(`cuarentas`)
  bgs.push('#E8EEE8')
  penPalettes.push('#304435')
  flowerPalettes.push([
    '#CE4676',
    '#F50087',
    '#E70D85',
    '#F34FA9',
    '#F480C0',
    '#F58AC5',
    '#F594C9',
  ])
  leafPalettes.push(['#3BB071', '#36A169', '#4D935F'])
  grassPalettes.push(['#219E80', '#1DB191', '#1AAA89'])
  riverPalettes.push(['#EBBFA8', '#E9C1AF', '#EECEBE', '#F4DACD', '#F7E6DE'])
  beePalettes.push({
    body: '#DE82A2',
    stripes: '#D62965',
    wings: '#EC51B5',
  })
  ladyPalettes.push({
    body: '#FCCADC',
    dots: '#EC51B5',
  })
  mothPalettes.push({
    body: '#E04242',
    wings: '#E88E73',
  })

  // 8
  names.push(`noche de invierno`)
  bgs.push('#1E003D')
  penPalettes.push('#F1B132')
  flowerPalettes.push(
    [
      '#670F4D',
      '#AF1D5C',
      '#F07076',
      '#E472B6',
      '#CC61CC',
      '#C178E8',
      '#E5EC9D',
    ].reverse(),
  )
  leafPalettes.push(['#9445E3', '#8C3EDA', '#7A2BCA'])
  grassPalettes.push(['#945BCD', '#8C4FC9', '#7A4CA9'])
  riverPalettes.push(['#EAD58A', '#EFE1A9', '#F2E7BA', '#F4EBC7'])
  beePalettes.push({
    body: '#D9F7F5',
    stripes: '#84F0DA',
    wings: '#4DFEDB',
  })
  ladyPalettes.push({
    body: '#FCCADC',
    dots: '#F8DC96',
  })
  mothPalettes.push({
    body: '#C4CFF7',
    wings: '#7EB0F7',
  })

  palette = {
    bg: bgs[index],
    flowerPalette: flowerPalettes[index],
    leafPalette: leafPalettes[index],
    grassPalette: grassPalettes[index],
    riverPalette: riverPalettes[index],
    penColor: penPalettes[index],
    beePalette: beePalettes[index],
    ladyPalette: ladyPalettes[index],
    mothPalette: mothPalettes[index],
    name: names[index],
  }
}
