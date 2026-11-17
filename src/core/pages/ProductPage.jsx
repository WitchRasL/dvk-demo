import { useParams } from 'react-router';
import PageStub from './PageStub.jsx';

export default function ProductPage() {
  const { slug } = useParams();
  return <PageStub name="product" title="Карточка товара" lead={`Адрес товара: ${slug}`} />;
}
