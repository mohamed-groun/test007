<?php

namespace App\Controller;

use App\Entity\Contact;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;


class ContactController extends AbstractController
{
    #[Route('/contact/submit', name: 'contact_submit', methods: ['POST'])]
    public function submit(
        Request $request,
        EntityManagerInterface $em,
        CsrfTokenManagerInterface $csrfTokenManager
    ): Response {
        $token = new CsrfToken('contact_form', $request->request->get('_token'));

        if (!$csrfTokenManager->isTokenValid($token)) {
            throw $this->createAccessDeniedException('Invalid CSRF token');
        }
        $contact = new Contact();

        $contact->setName($request->request->get('name'));
        $contact->setEmail($request->request->get('email'));
        $contact->setNumber($request->request->get('number'));
        $contact->setSubject($request->request->get('subject'));
        $contact->setMessage($request->request->get('message'));
        $contact->setCreatedAt(new \DateTimeImmutable());

        $em->persist($contact);
        $em->flush();

        $this->addFlash('success', 'Thank you');

        return $this->redirectToRoute('app_generator'); // or wherever your contact section is
    }







}
