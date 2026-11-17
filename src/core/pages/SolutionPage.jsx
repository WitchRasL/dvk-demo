import { useParams } from 'react-router';
import PageStub from './PageStub.jsx';

export default function SolutionPage() {
  const { industry } = useParams();
  return <PageStub name="solution" title="Решение для отрасли" lead={`Отрасль: ${industry}`} />;
}
