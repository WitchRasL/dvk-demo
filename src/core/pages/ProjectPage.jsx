import { useParams } from 'react-router';
import PageStub from './PageStub.jsx';

export default function ProjectPage() {
  const { slug } = useParams();
  return <PageStub name="project" title="Кейс" lead={`Адрес проекта: ${slug}`} />;
}
