/**
 * Diccionario y catálogo de errores e incidencias frecuentes del SRI Ecuador (Ficha Técnica Comprobantes Electrónicos)
 */

export interface SriErrorInfo {
  code: string
  title: string
  cause: string
  solution: string
  isWarning?: boolean
}

export const SRI_ERROR_CATALOG: Record<string, SriErrorInfo> = {
  '39': {
    code: '39',
    title: 'Firma Electrónica Inválida (XAdES-BES)',
    cause: 'El SRI no pudo validar la firma digital del comprobante. Causas comunes: archivo .p12 caducado, contraseña de la firma incorrecta, certificado no emitido por una entidad autorizada en Ecuador (BCE, Security Data, FirmaSegura, etc.), o alteración en el XML firmado.',
    solution: '1. Ve a Configuración > Empresas > Firma electrónica y usa "Obtener fecha de caducidad" para verificar si está vigente.\n2. Asegúrate de haber ingresado la contraseña correcta del archivo .p12.\n3. Guarda los cambios y vuelve a emitir el comprobante.'
  },
  '15': {
    code: '15',
    title: 'Secuencial Registrado / Clave de Acceso Duplicada',
    cause: 'El número secuencial (ej. 001-001-000000001) o la clave de acceso de 49 dígitos ya fue recibido o autorizado previamente en el SRI.',
    solution: 'Verifica en Puntos de Emisión el número correlativo configurado para este tipo de documento y emite con el siguiente número disponible.'
  },
  '35': {
    code: '35',
    title: 'Estructura o Cálculos del Comprobante Inválidos',
    cause: 'Hay inconsistencias en los campos obligatorios del XML, o los cálculos de subtotales, impuestos (IVA 15%, 0%) y total no cuadran matemáticamente según la ficha técnica del SRI.',
    solution: 'Revisa las cantidades, precios unitarios, descuentos y la tarifa de IVA seleccionada para confirmar que la suma de bases imponibles más IVA coincida exactamente con el total.'
  },
  '43': {
    code: '43',
    title: 'RUC No Autorizado en Facturación Electrónica',
    cause: 'El RUC de la empresa emisora no tiene habilitada la emisión de comprobantes electrónicos en el ambiente seleccionado (Pruebas o Producción) en el portal del SRI, o el RUC se encuentra suspendido.',
    solution: 'Ingresa con tu clave a sri.gob.ec > Facturación Electrónica > Producción/Pruebas > Autorización, y solicita la habilitación para tu RUC.'
  },
  '45': {
    code: '45',
    title: 'Secuencial Registrado o Establecimiento No Válido',
    cause: 'El número secuencial ya fue emitido y recibido por el SRI en este punto de emisión, o el código de establecimiento (ej. 001) / punto de emisión (ej. 001) no coincide con los registrados en el RUC.',
    solution: '1. Si el secuencial ya existe, incrementa el correlativo en Puntos de Emisión.\n2. Si es una nueva sucursal, confirma que el establecimiento de 3 dígitos esté activo en tu RUC en el SRI.'
  },
  '47': {
    code: '47',
    title: 'Fecha de Emisión Fuera de Plazo',
    cause: 'La fecha de emisión del comprobante supera el plazo máximo admitido por el SRI (más de 24 horas hacia el pasado) o tiene una fecha futura respecto a la hora del SRI.',
    solution: 'Emite el documento con la fecha actual del día y asegúrate de que la hora de tu equipo esté sincronizada con la hora oficial de Ecuador.'
  },
  '49': {
    code: '49',
    title: 'Comprobante Modificado No Existe o No Autorizado',
    cause: 'En Notas de Crédito: la factura sustento que se intenta modificar (numDocModificado) no existe en los registros del SRI o aún no tiene estado AUTORIZADO.',
    solution: 'Asegúrate de que la factura de venta ya haya sido autorizada por el SRI antes de emitirle una Nota de Crédito complementaria.'
  },
  '56': {
    code: '56',
    title: 'Fecha de la Factura Modificada Posterior a la Nota de Crédito',
    cause: 'En Notas de Crédito: la fecha de la factura de sustento es mayor (posterior) a la fecha de emisión de la Nota de Crédito.',
    solution: 'La fecha de emisión de la Nota de Crédito debe ser igual o posterior a la fecha en que se emitió la factura original.'
  },
  '58': {
    code: '58',
    title: 'Comprobante Ya Modificado en su Totalidad o Anulado',
    cause: 'La factura sustento ya fue anulada previamente o ya tiene notas de crédito que cubren el 100% de su valor.',
    solution: 'Revisa las notas de crédito previas asociadas a esta factura antes de emitir una nueva modificación.'
  },
  '60': {
    code: '60',
    title: 'Fecha de Emisión Inválida',
    cause: 'El formato de fecha no cumple con el estándar exigido por el SRI (dd/mm/aaaa) o tiene desfase de tiempo.',
    solution: 'Verifica la fecha de emisión del comprobante.'
  },
  '65': {
    code: '65',
    title: 'Caracteres Especiales No Admitidos en el XML',
    cause: 'El documento contiene caracteres como ampersand (&), comillas, signos menor/mayor (< >) o caracteres extraños en la razón social, dirección u observaciones.',
    solution: 'Edita los datos del cliente u observaciones eliminando símbolos especiales o caracteres tipográficos no compatibles.'
  },
  '70': {
    code: '70',
    title: 'Clave de Acceso Inválida',
    cause: 'El dígito verificador o la estructura de 49 dígitos de la clave de acceso no superó el algoritmo Módulo 11 del SRI.',
    solution: 'El sistema recalculará la clave de acceso de 49 dígitos automáticamente al reenviar.'
  }
}

/**
 * Busca y resuelve la explicación amigable de un error devuelto por el SRI
 */
export function resolveSriErrorInfo(code?: string | null, message?: string | null): SriErrorInfo | null {
  const cleanCode = String(code || '').trim()
  if (cleanCode && SRI_ERROR_CATALOG[cleanCode]) {
    return SRI_ERROR_CATALOG[cleanCode] || null
  }

  const text = `${cleanCode} ${message || ''}`.toLowerCase()

  if (text.includes('39') || text.includes('firma') || text.includes('certificado') || text.includes('xades')) {
    return SRI_ERROR_CATALOG['39'] || null
  }
  if (text.includes('15') || (text.includes('secuencial') && text.includes('registrado')) || text.includes('duplicad')) {
    return SRI_ERROR_CATALOG['15'] || null
  }
  if (text.includes('35') || text.includes('descuadr') || text.includes('total')) {
    return SRI_ERROR_CATALOG['35'] || null
  }
  if (text.includes('43') || (text.includes('ruc') && text.includes('no autorizado'))) {
    return SRI_ERROR_CATALOG['43'] || null
  }
  if (text.includes('45') || text.includes('establecimiento')) {
    return SRI_ERROR_CATALOG['45'] || null
  }
  if (text.includes('47') || text.includes('60') || text.includes('fuera de plazo') || text.includes('plazo')) {
    return SRI_ERROR_CATALOG['47'] || null
  }
  if (text.includes('49') || (text.includes('modificado') && text.includes('no existe'))) {
    return SRI_ERROR_CATALOG['49'] || null
  }
  if (text.includes('56') || (text.includes('modificado') && text.includes('fecha'))) {
    return SRI_ERROR_CATALOG['56'] || null
  }
  if (text.includes('65') || text.includes('caracter') || text.includes('sintaxis')) {
    return SRI_ERROR_CATALOG['65'] || null
  }

  return null
}
