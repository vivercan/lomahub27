import { useState } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Send } from 'lucide-react';
import { tokens } from '../../lib/tokens';

interface Conversation {
  id: string;
  nombre: string;
  ultimoMensaje: string;
  hora: string;
  noLectura: number;
}

interface ChatMessage {
  id: string;
  tipo: 'entrante' | 'saliente';
  contenido: string;
  hora: string;
}

const conversaciones: Conversation[] = [
  {
    id: '1',
    nombre: 'Transportes García',
    ultimoMensaje: 'Confirmo recepción de la carga en Monterrey',
    hora: '14:32',
    noLectura: 2,
  },
  {
    id: '2',
    nombre: 'Juan Pérez (Operador)',
    ultimoMensaje: 'Ya estoy en la caseta de Querétaro',
    hora: '13:45',
    noLectura: 0,
  },
  {
    id: '3',
    nombre: 'Distribuidora México',
    ultimoMensaje: '¿Cuál es el horario de entrega estimado?',
    hora: '12:15',
    noLectura: 1,
  },
  {
    id: '4',
    nombre: 'Logística Integral',
    ultimoMensaje: 'Agradecemos el servicio prestado',
    hora: '11:20',
    noLectura: 0,
  },
  {
    id: '5',
    nombre: 'Carlos López (Operador)',
    ultimoMensaje: 'Necesito gasolina en el próximo destino',
    hora: '10:05',
    noLectura: 3,
  },
];

const chatMessages: ChatMessage[] = [
  {
    id: '1',
    tipo: 'entrante',
    contenido: 'Hola, ¿qué tal el viaje?',
    hora: '14:30',
  },
  {
    id: '2',
    tipo: 'saliente',
    contenido: 'Todo bien, llegamos a tiempo.',
    hora: '14:31',
  },
  {
    id: '3',
    tipo: 'entrante',
    contenido: 'Perfecto, confirmo recepción de la carga en Monterrey',
    hora: '14:32',
  },
  {
    id: '4',
    tipo: 'saliente',
    contenido: 'Gracias por confirmar. ¿Necesitas algo más?',
    hora: '14:33',
  },
  {
    id: '5',
    tipo: 'entrante',
    contenido: 'No por ahora. Nos vemos para el próximo viaje.',
    hora: '14:35',
  },
];

export default function WhatsApp() {
  const [replyText, setReplyText] = useState('');

  const handleSendReply = () => {
    if (replyText.trim()) {
      console.log('Enviando mensaje:', replyText);
      setReplyText('');
    }
  };

  return (
    <ModuleLayout titulo="WhatsApp — Bandeja de Mensajes">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: tokens.spacing.md,
          height: 'calc(100vh - 200px)',
        }}
      >
        {/* Left Column - Conversations List */}
        <div
          style={{
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
        <Card>
          <div
            style={{
              paddingBottom: tokens.spacing.md,
              marginBottom: tokens.spacing.md,
              borderBottom: `1px solid ${tokens.colors.border}`,
            }}
          >
            <h3
              style={{
                color: tokens.colors.textPrimary,
                margin: 0,
              }}
            >
              Conversaciones
            </h3>
          </div>

          <div
            style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: tokens.spacing.xs,
            }}
          >
            {conversaciones.map((conv) => (
              <div
                key={conv.id}
                style={{
                  padding: tokens.spacing.sm,
                  borderRadius: tokens.radius.lg,
                  backgroundColor: conv.noLectura > 0 ? tokens.colors.bgHover : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: tokens.spacing.xs,
                  }}
                >
                  <h4
                    style={{
                      color: tokens.colors.textPrimary,
                      margin: 0,
                      flex: 1,
                    }}
                  >
                    {conv.nombre}
                  </h4>
                  <span
                    style={{
                      color: tokens.colors.textSecondary,
                      marginLeft: tokens.spacing.xs,
                    }}
                  >
                    {conv.hora}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: tokens.spacing.xs,
                  }}
                >
                  <p
                    style={{
                      color: tokens.colors.textSecondary,
                      margin: 0,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {conv.ultimoMensaje}
                  </p>
                  {conv.noLectura > 0 && (
                    <Badge color="red">{conv.noLectura}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
        </div>

        {/* Right Column - Chat */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
        <Card>
          <div
            style={{
              paddingBottom: tokens.spacing.md,
              marginBottom: tokens.spacing.md,
              borderBottom: `1px solid ${tokens.colors.border}`,
            }}
          >
            <h3
              style={{
                color: tokens.colors.textPrimary,
                margin: 0,
              }}
            >
              Conversación — Transportes García
            </h3>
          </div>

          <div
            style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: tokens.spacing.md,
              marginBottom: tokens.spacing.md,
            }}
          >
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.tipo === 'entrante' ? 'flex-start' : 'flex-end',
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    backgroundColor: msg.tipo === 'entrante' ? tokens.colors.bgHover : tokens.colors.blue,
                    color: msg.tipo === 'entrante' ? tokens.colors.textPrimary : '#fff',
                    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                    borderRadius: tokens.radius.lg,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      marginBottom: tokens.spacing.xs,
                    }}
                  >
                    {msg.contenido}
                  </p>
                  <span
                    style={{
                      opacity: 0.7,
                    }}
                  >
                    {msg.hora}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              gap: tokens.spacing.sm,
              alignItems: 'flex-end',
            }}
          >
            <textarea
              placeholder="Escribe tu respuesta..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: tokens.radius.lg,
                background: tokens.colors.bgHover,
                border: `1px solid ${tokens.colors.border}`,
                color: tokens.colors.textPrimary,
                fontFamily: tokens.fonts.body,
                resize: 'none',
              }}
            />
            <Button
              onClick={handleSendReply}
              variant="primary"
              size="sm"
              disabled={!replyText.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: tokens.spacing.xs,
              }}
            >
              <Send size={16} />
              Enviar
            </Button>
          </div>
        </Card>
        </div>
      </div>
    </ModuleLayout>
  );
}
