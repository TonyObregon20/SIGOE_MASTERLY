import { ShopContainer, ShopPageTitle, shopImages } from './ShopUI';
import { ShopCollectionTile, ShopFeature } from './ShopEditorial';

const collections = [
  { category: 'Formal', title: 'Presencia. Sin esfuerzo.', label: 'La línea formal', image: shopImages.campaign, description: 'Camisas para el trabajo, las reuniones y esos días en los que cada detalle cuenta.' },
  { category: 'Casual', title: 'Menos reglas. Más tú.', label: 'Casual y Oxford', image: shopImages.oxford, description: 'Texturas y cortes para vestir a tu ritmo. De la primera reunión a la última sobremesa.' },
  { category: 'Exterior', title: 'Tu estilo no termina aquí.', label: 'La selección exterior', image: shopImages.navy, description: 'Prendas para completar tu selección y darle otra intención a los días de siempre.' },
];

export default function ShopCollections({ onBrowse }) {
  return (
    <>
      <ShopPageTitle eyebrow="Colecciones Masterly" title="Una camisa. Muchas maneras de llevarla.">Elige la ocasión. Nosotros ponemos atención en los detalles.</ShopPageTitle>
      <ShopContainer className="pb-12 md:pb-[76px]"><div className="grid gap-8 sm:grid-cols-3 sm:gap-5">{collections.map(collection => <ShopCollectionTile key={collection.category} {...collection} onBrowse={onBrowse} />)}</div></ShopContainer>
      <ShopFeature image={shopImages.shirts} alt="Camisas y tejidos de la colección" label="Encuentra la tuya" title="Las buenas elecciones se vuelven costumbre." action="Explorar todas las camisas" onBrowse={() => onBrowse()}>Revisa los modelos, elige tu talla y guarda en la bolsa las prendas que van contigo.</ShopFeature>
    </>
  );
}
