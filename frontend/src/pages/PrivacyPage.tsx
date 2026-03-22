import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidade</h1>
        <p className="text-sm text-gray-400 mb-10">Última atualização: março de 2025</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Quem somos</h2>
            <p>
              A <strong>Locaweb Start</strong> é uma plataforma de criação de sites profissionais com Inteligência Artificial,
              operada pela Locaweb Serviços de Internet S.A., inscrita no CNPJ nº 02.351.877/0001-52,
              com sede em São Paulo/SP. Para fins da Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018),
              atuamos como <strong>controlador</strong> dos dados pessoais tratados nesta plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Dados que coletamos</h2>
            <p>Coletamos os seguintes dados pessoais:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Cadastro:</strong> nome completo e endereço de e-mail.</li>
              <li><strong>Conteúdo gerado:</strong> nome do negócio, descrição e informações do site criado.</li>
              <li><strong>Pagamentos:</strong> dados de cartão de crédito são processados diretamente pela Vindi (PCI-DSS Level 1); não armazenamos dados de pagamento.</li>
              <li><strong>Uso da plataforma:</strong> logs de acesso, endereço IP, tipo de dispositivo e navegador.</li>
              <li><strong>Cookies:</strong> cookies de sessão e preferências (veja seção 6).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Finalidade do tratamento</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Prestação dos serviços contratados (criação e publicação de sites).</li>
              <li>Processamento de pagamentos e gerenciamento de assinaturas.</li>
              <li>Comunicações transacionais (confirmação de cadastro, avisos de cobrança).</li>
              <li>Melhoria contínua da plataforma e análise de uso agregado.</li>
              <li>Cumprimento de obrigações legais e regulatórias.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Base legal</h2>
            <p>
              O tratamento dos dados é realizado com base nas seguintes hipóteses legais previstas na LGPD:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Execução de contrato</strong> (art. 7º, V): necessário para a prestação do serviço contratado.</li>
              <li><strong>Legítimo interesse</strong> (art. 7º, IX): análise de uso para melhoria da plataforma.</li>
              <li><strong>Cumprimento de obrigação legal</strong> (art. 7º, II): quando exigido por lei.</li>
              <li><strong>Consentimento</strong> (art. 7º, I): para cookies não essenciais.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Compartilhamento de dados</h2>
            <p>Seus dados podem ser compartilhados com:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Vindi:</strong> processador de pagamentos, para execução de cobranças.</li>
              <li><strong>Google (Gemini API):</strong> o conteúdo do seu negócio é enviado para geração do site via IA. A Google atua como subprocessador conforme seus termos de serviço.</li>
              <li><strong>Supabase / Neon:</strong> provedor de banco de dados em nuvem, onde os dados são armazenados com criptografia em repouso.</li>
              <li><strong>Autoridades:</strong> quando exigido por determinação judicial ou legal.</li>
            </ul>
            <p className="mt-2">Não vendemos, alugamos ou cedemos seus dados a terceiros para fins de marketing.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Cookies</h2>
            <p>Utilizamos os seguintes tipos de cookies:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Sessão (essenciais):</strong> necessários para autenticação e funcionamento da plataforma. Não podem ser desativados.</li>
              <li><strong>Preferências:</strong> armazenam configurações locais do usuário (ex.: consentimento de cookies).</li>
            </ul>
            <p className="mt-2">
              Você pode gerenciar cookies nas configurações do seu navegador. A recusa de cookies não essenciais não afeta o acesso aos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Retenção dos dados</h2>
            <p>
              Mantemos seus dados pelo tempo necessário à prestação dos serviços e cumprimento de obrigações legais.
              Após o encerramento da conta, os dados são removidos em até 90 dias, salvo quando a retenção for exigida por lei
              (ex.: dados fiscais por 5 anos, conforme o Código Tributário Nacional).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Seus direitos</h2>
            <p>Nos termos da LGPD, você tem direito a:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Confirmar a existência de tratamento e acessar seus dados.</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.</li>
              <li>Portabilidade dos dados a outro fornecedor.</li>
              <li>Revogar consentimento a qualquer momento.</li>
              <li>Obter informações sobre o compartilhamento de dados.</li>
            </ul>
            <p className="mt-2">
              Para exercer seus direitos, entre em contato pelo e-mail:{' '}
              <a href="mailto:privacidade@locaweb.com.br" className="text-blue-600 hover:underline">
                privacidade@locaweb.com.br
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Segurança</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
              criptografia em trânsito (TLS 1.2+), criptografia em repouso, autenticação por senha hasheada (bcrypt),
              e controles de acesso baseados em função. Em caso de incidente de segurança, notificaremos os titulares
              afetados e a Autoridade Nacional de Proteção de Dados (ANPD) conforme exigido pela LGPD.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Encarregado de Dados (DPO)</h2>
            <p>
              O encarregado pelo tratamento de dados pessoais na Locaweb Start pode ser contatado pelo e-mail:{' '}
              <a href="mailto:dpo@locaweb.com.br" className="text-blue-600 hover:underline">
                dpo@locaweb.com.br
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Alterações nesta política</h2>
            <p>
              Esta política pode ser atualizada periodicamente. Comunicaremos alterações relevantes por e-mail
              ou mediante aviso na plataforma. O uso continuado após a notificação implica aceitação das mudanças.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
