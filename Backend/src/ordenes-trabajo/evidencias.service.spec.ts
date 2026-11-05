import { detectarImagen } from './evidencias.service';

const relleno = Buffer.alloc(16);

describe('detección de imágenes por contenido', () => {
  it('reconoce JPEG, PNG y WebP por su firma binaria', () => {
    expect(detectarImagen(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), relleno]))?.mime).toBe('image/jpeg');
    expect(detectarImagen(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), relleno]))?.mime).toBe('image/png');
    expect(detectarImagen(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), relleno]))?.mime).toBe('image/webp');
  });

  it('rechaza archivos que no son imagen aunque declaren serlo', () => {
    expect(detectarImagen(Buffer.from('<?php system($_GET["c"]); ?>' + ' '.repeat(20)))).toBeNull();
    expect(detectarImagen(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))).toBeNull();
    expect(detectarImagen(Buffer.alloc(4))).toBeNull();
  });
});
