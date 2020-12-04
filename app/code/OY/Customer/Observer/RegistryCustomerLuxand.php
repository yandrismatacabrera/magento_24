<?php
/**
 * Created by PhpStorm.
 * User: root
 * Date: 04/12/20
 * Time: 12:14 AM
 */
namespace OY\Customer\Observer;

use Magento\Framework\Event\ObserverInterface;
use Lentesplus\Stores\Api\Data\StoresInterface;

class RegistryCustomerLuxand implements ObserverInterface
{
    public function __construct (
        \OY\Registry\Helper\Luxand $luxand,
        \Magento\Framework\App\Filesystem\DirectoryList $directoryList,
        \Magento\Store\Model\StoreManagerInterface $storeManager,
        \Magento\Customer\Api\CustomerRepositoryInterface $customerRepository,
        \Magento\Framework\Message\ManagerInterface $manager
    ) {
        $this->luxand         = $luxand;
        $this->directoryList=$directoryList;
        $this->storeManager=$storeManager;
        $this->customerRepository=$customerRepository;
        $this->manager=$manager;
    }

    public function execute(\Magento\Framework\Event\Observer $observer)
    {

        $customer = $this->customerRepository->getById($observer->getCustomer()->getId());

        if($customer->getCustomAttribute('luxand_registry') && $customer->getCustomAttribute('luxand_registry')->getValue()){

            return $this;
        }

        $img=$customer->getCustomAttribute('customer_image')->getValue();

        $imagePub ='pub/media/customer'.$img;

        $registry = $this->luxand->createCustomer($customer->getId(), 0, $imagePub);

        if($registry){
          print_r($registry);die;
          $customer->setCustomAttribute('luxand_registry',1);
          $this->customerRepository->save($customer);
        }

        return $this;
    }
}
