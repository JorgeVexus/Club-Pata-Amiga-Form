'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AmbassadorForm from '@/components/AmbassadorForm/AmbassadorForm';
import BrandLogo from '@/components/UI/BrandLogo';
import styles from './page.module.css';

interface MemberData {
  id: string;
  email: string;
  firstName: string;
  paternalLastName: string;
  maternalLastName?: string;
  phone?: string;
  customFields?: Record<string, string>;
}

function LoadingCard() {
  return (
    <div className={styles.pageBackground}>
      <div className={styles.loadingCard}>
        <div className={styles.spinner}></div>
        <p>Verificando tu cuenta...</p>
      </div>
    </div>
  );
}

function AmbassadorStepper({ currentStep = 1 }: { currentStep?: number }) {
  const steps = [
    { id: 1, label: 'Completa tu perfil', icon: '👤' },
    { id: 2, label: 'informacion adicional', icon: '📋' },
    { id: 3, label: 'datos bancario y rfc', icon: '💰' },
  ];

  return (
    <div className={styles.stepper}>
      {steps.map((step, index) => (
        <div key={step.id} className={styles.stepperItem}>
          <div className={`${styles.stepIcon} ${currentStep === step.id ? styles.stepIconActive : currentStep > step.id ? styles.stepIconCompleted : styles.stepIconInactive}`}>
            {currentStep > step.id ? '✓' : step.icon}
          </div>
          <span className={`${styles.stepLabel} ${currentStep === step.id ? styles.stepLabelActive : currentStep > step.id ? styles.stepLabelCompleted : styles.stepLabelInactive}`}>
            {step.label}
          </span>
          {index < steps.length - 1 && (
            <div className={`${styles.stepArrow} ${currentStep > step.id ? styles.stepArrowCompleted : ''}`}>→</div>
          )}
        </div>
      ))}
    </div>
  );
}

function AmbassadorRegistrationContent() {
  const searchParams = useSearchParams();
  const memberIdFromUrl = searchParams.get('memberId');

  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const checkMemberStatus = async () => {
      setIsLoading(true);

      if (memberIdFromUrl) {
        try {
          const response = await fetch(`/api/memberstack/member?id=${memberIdFromUrl}`);
          const data = await response.json();

          if (data.success && data.member) {
            setMemberData({
              id: data.member.id,
              email: data.member.auth?.email || '',
              firstName: data.member.customFields?.['first-name'] || '',
              paternalLastName: data.member.customFields?.['paternal-last-name'] || '',
              maternalLastName: data.member.customFields?.['maternal-last-name'] || '',
              phone: data.member.customFields?.['phone'] || '',
              customFields: data.member.customFields
            });
            setIsLoggedIn(true);
          }
        } catch (err) {
          console.error('Error cargando datos del miembro:', err);
        }
        setIsLoading(false);
        return;
      }

      if (typeof window !== 'undefined' && window.$memberstackDom) {
        try {
          const result = await window.$memberstackDom.getCurrentMember();
          if (result?.data) {
            const cf = result.data.customFields || {};
            setMemberData({
              id: result.data.id,
              email: result.data.auth?.email || '',
              firstName: cf['first-name'] || '',
              paternalLastName: cf['paternal-last-name'] || '',
              maternalLastName: cf['maternal-last-name'] || '',
              phone: cf['phone'] || '',
              customFields: cf
            });
            setIsLoggedIn(true);
          }
        } catch (err) {
          console.log('No hay sesion de Memberstack activa');
        }
      }

      setIsLoading(false);
    };

    const timer = setTimeout(checkMemberStatus, 500);
    return () => clearTimeout(timer);
  }, [memberIdFromUrl]);

  if (isLoading) {
    return <LoadingCard />;
  }

  const initialStep = (isLoggedIn && memberData) ? 2 : 1;
  
  // Usar el paso actual del estado si ya fue inicializado, sino usar initialStep
  const displayStep = currentStep || initialStep;

  return (
    <div className={styles.pageBackground}>
      <BrandLogo />
      <div className={styles.whiteCard}>
        {/* Imagen del gato - Step 1 */}
        <img
          id="embajador-img-gato"
          src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1771514548/embajadores_pantalla_1_lkuaio.png"
          alt=""
          className={styles.decorativeImage}
          aria-hidden
        />
        {/* Imagen de la niña - Step 2 (inicialmente oculta) */}
        <img
          id="embajador-img-nina"
          src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1771518105/embajadores_step_2_gol1df.png"
          alt=""
          className={styles.decorativeImage}
          style={{ display: 'none' }}
          aria-hidden
        />
        {/* Imagen del hombre con tarjeta - Step 3 (inicialmente oculta) */}
        <img
          id="embajador-img-hombre"
          src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1771530730/embajadores_step_3_oy2cbb.png"
          alt=""
          className={styles.decorativeImage}
          style={{ display: 'none' }}
          aria-hidden
        />
        {/* Imagen de éxito - Step 4 (inicialmente oculta) */}
        <img
          id="embajador-img-exito"
          src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1771533698/Centros_1_oortwx.png"
          alt=""
          className={styles.decorativeImage}
          style={{ display: 'none' }}
          aria-hidden
        />
        <h1 className={styles.mainTitle}>se embajador pata amiga</h1>

        {isLoggedIn && memberData && (
          <div className={styles.userGreeting}>
            <span>Hola, <strong>{memberData.firstName || memberData.email}</strong> 👋</span>
            <button
              onClick={async () => {
                if (window.$memberstackDom) {
                  await window.$memberstackDom.logout();
                  window.location.reload();
                }
              }}
              className={styles.logoutLink}
            >
              No eres tu? Cerrar sesion
            </button>
          </div>
        )}

        <AmbassadorStepper currentStep={displayStep} />

        <div className={styles.contentLayout}>
          <div className={styles.formColumn}>
            <AmbassadorForm
              linkedMemberstackId={memberData?.id}
              preloadedData={memberData ? {
                firstName: memberData.firstName,
                paternalLastName: memberData.paternalLastName,
                maternalLastName: memberData.maternalLastName,
                email: memberData.email,
                phone: memberData.phone,
                customFields: memberData.customFields
              } : undefined}
              startAtStep={initialStep}
              hideHeader={true}
              onStepChange={setCurrentStep}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AmbassadorRegistrationPage() {
  return (
    <Suspense fallback={<LoadingCard />}>
      <AmbassadorRegistrationContent />
    </Suspense>
  );
}
