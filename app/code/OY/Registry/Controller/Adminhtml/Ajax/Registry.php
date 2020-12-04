<?php
/**
 * Created by PhpStorm.
 * User: root
 * Date: 03/12/20
 * Time: 09:53 AM
 */
namespace OY\Registry\Controller\Adminhtml\Ajax;
use Magento\Backend\App\Action;


class Registry extends \Magento\Backend\App\Action
{
    protected $resultJsonFactory;

    public function __construct(
        Action\Context $context,
        \Magento\Framework\Controller\Result\JsonFactory $resultJsonFactory,
        \Magento\Customer\Api\CustomerRepositoryInterface $customerRepository,
        \OY\Registry\Model\RegistryFactory $registryFactory,
        \OY\Registry\Api\RegistryRepositoryInterface $registryRepository,
        \Magento\Framework\Stdlib\DateTime\TimezoneInterface $timezone
    )
    {
        parent::__construct($context);
        $this->resultJsonFactory = $resultJsonFactory;

        $this->customerRepository=$customerRepository;
        $this->registryFactory=$registryFactory;
        $this->registryRepository=$registryRepository;
        $this->timezone=$timezone;
    }


    public function execute()
    {
        $result = $this->resultJsonFactory->create();
        $data=[];

        if($this->getRequest()->getParam('customer_id'))
        {

            try{

                $customer = $this->customerRepository->getById((int)$this->getRequest()->getParam('customer_id'));
                $fullName = $customer->getFirstname().' '.$customer->getLastname();
                //$dateTime = $this->timezone->date()->format('Y-m-d H:i:s');
                $dateTime=date("Y-m-d H:i:s");

                $registry = $this->registryFactory->create();
                $registry->setCustomerId((int)$this->getRequest()->getParam('customer_id'));
                $registry->setDateTime($dateTime);
                $registry->setFullname($fullName);

                $this->registryRepository->save($registry);

                $data["success"]=true;
                $data["msg"]="Registro satisfactorio.";


            }catch (Exception $e){

                $data["success"]=false;
                $data["msg"]="El usuario no existe.";
                return $data;
            }
        }

        return $result->setData($data);
    }


}

