<?php
/**
 * Created by PhpStorm.
 * User: root
 * Date: 23/11/20
 * Time: 02:26 PM
 */
namespace OY\Registry\Model;

use OY\Registry\Api\RegistryManagementInterface;

class RegistryManagement implements RegistryManagementInterface
{

    public function __construct (
        \Magento\Framework\Webapi\Rest\Request $request,
        \OY\Registry\Helper\Luxand $luxand,
        \Magento\Framework\App\Filesystem\DirectoryList $directoryList,
        \Magento\Store\Model\StoreManagerInterface $storeManager
    ) {

        $this->request         = $request;
        $this->luxand         = $luxand;
        $this->directoryList=$directoryList;
        $this->storeManager=$storeManager;
    }

    public function recognitionFace()
    {

        $param = $this->request->getBodyParams();

        return $this->luxand->callRecognition($param['image']);
    }

    public function createCustomer()
    {
        $param = $this->request->getBodyParams();

        $imgContent64Base = $param['image']['base64_encoded_data'];
        $imgName = $param['image']['name'];
        $imgType = $param['image']['type'];
        $media_dir = $this->directoryList->getPath('media');

        $data = 'data:'.$imgType.';base64,'.$imgContent64Base;

        file_put_contents($media_dir.'/customer/'.$imgName, base64_decode($data));

        $imagePub =$this->storeManager->getStore()->getBaseUrl().'media/'.$imgName;

        return $this->luxand->createCustomer($param['name'], $param['store'], $imagePub);
    }


}