'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AmbassadorForm from '@/components/AmbassadorForm/AmbassadorForm';
import NavbarRedesign from '@/components/RegistrationV2/NavbarRedesign';
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
  const steps = ['Solicitud', 'Enviada', 'Completar perfil'];

  return (
    <div className={styles.stepper}>
      {steps.map((label, index) => {
        const number = index + 1;
        const isActive = number === currentStep;
        const isCompleted = number < currentStep;
        return (
          <div key={label} className={`${styles.stepperItem} ${isActive ? styles.stepperItemActive : ''} ${isCompleted ? styles.stepperItemCompleted : ''}`}>
            <div className={`${styles.stepIcon} ${isActive ? styles.stepIconActive : ''} ${isCompleted ? styles.stepIconCompleted : ''}`}>
              {isCompleted ? '✓' : number}
            </div>
            <span className={`${styles.stepLabel} ${isActive ? styles.stepLabelActive : ''} ${isCompleted ? styles.stepLabelCompleted : ''}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function AmbassadorRegistrationContent() {
  const searchParams = useSearchParams();
  const memberIdFromUrl = searchParams.get('memberId');

  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const checkMemberStatus = async () => {
      setIsLoading(true);
      setHasActiveSession(false);

      if (typeof window !== 'undefined' && window.$memberstackDom) {
        try {
          const sessionResult = await window.$memberstackDom.getCurrentMember();
          if (sessionResult?.data) {
            setHasActiveSession(true);
          }
        } catch {
          setHasActiveSession(false);
        }
      }

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
              phone: data.member.customFields?.phone || '',
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
            setHasActiveSession(true);
            const cf = result.data.customFields || {};
            setMemberData({
              id: result.data.id,
              email: result.data.auth?.email || '',
              firstName: cf['first-name'] || '',
              paternalLastName: cf['paternal-last-name'] || '',
              maternalLastName: cf['maternal-last-name'] || '',
              phone: cf.phone || '',
              customFields: cf
            });
            setIsLoggedIn(true);
          }
        } catch (err) {
          console.log('No hay sesion de Memberstack activa', err);
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

  const handleLogout = async () => {
    if (typeof window !== 'undefined' && window.$memberstackDom) {
      await window.$memberstackDom.logout();
      setHasActiveSession(false);
      window.location.reload();
    }
  };

  const isSuccessStep = currentStep >= 2;

  return (
    <div className={styles.mainWrapper}>
      <NavbarRedesign
        onLogout={handleLogout}
        member={memberData}
        showLogout={hasActiveSession}
      />
      <div 
        className={styles.pageBackground}
      >
        <div className={styles.whiteCard}>
          <img
            id="embajador-img-nina"
            src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1771518105/embajadores_step_2_gol1df.png"
            alt=""
            className={styles.decorativeImage}
            style={{ display: 'none' }}
            aria-hidden
          />
          <img
            id="embajador-img-hombre"
            src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1771530730/embajadores_step_3_oy2cbb.png"
            alt=""
            className={styles.decorativeImage}
            style={{ display: 'none' }}
            aria-hidden
          />

          {!isSuccessStep && <h1 className={styles.mainTitle}>Sé embajador Pata Amiga</h1>}

          {isLoggedIn && memberData && !isSuccessStep && (
            <div className={styles.userGreeting}>
              <span>Hola, <strong>{memberData.firstName || memberData.email}</strong></span>
              <button
                onClick={handleLogout}
                className={styles.logoutLink}
              >
                No eres tu? Cerrar sesion
              </button>
            </div>
          )}

        <AmbassadorStepper currentStep={currentStep} />

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
              startAtStep={1}
              hideHeader={true}
              onStepChange={setCurrentStep}
            />
          </div>
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
