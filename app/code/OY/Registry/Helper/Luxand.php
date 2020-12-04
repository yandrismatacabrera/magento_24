<?php
/**
 * Created by PhpStorm.
 * User: root
 * Date: 23/11/20
 * Time: 05:42 PM
 */
namespace OY\Registry\Helper;


class Luxand extends \Magento\Framework\App\Helper\AbstractHelper
{

    public function __construct(
        \Magento\Framework\App\Helper\Context $context
    ) {
        parent::__construct($context);
    }

    private function getConfig($config_path)
    {
        return $this->scopeConfig->getValue(
            $config_path,
            \Magento\Store\Model\ScopeInterface::SCOPE_STORE
        );
    }

    private function getToken(){
        return $this->getConfig("luxand_general/config_general/token");
    }

    private function getUrlRest(){
        return $this->getConfig("luxand_general/config_general/url");
    }

    public function callRecognition($img){

        $curl = curl_init();

        curl_setopt_array($curl, array(
            CURLOPT_URL => $this->getUrlRest()."/photo/search",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => "",
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => "POST",
            CURLOPT_POSTFIELDS => [ "photo" => curl_file_create($img)],
            // or use URL
            // CURLOPT_POSTFIELDS => [ "photo" => "https://dashboard.luxand.cloud/img/brad.jpg" ],
            CURLOPT_HTTPHEADER => array(
                "token: ".$this->getToken()
            ),
        ));

        $response = curl_exec($curl);
        $err = curl_error($curl);

        curl_close($curl);

        if ($err) {
            return "cURL Error #:" . $err;
        } else {
            return $response;
        }

    }

    public function createCustomer($name, $store,$img){

        $curl = curl_init();

        curl_setopt_array($curl, array(
            CURLOPT_URL => $this->getUrlRest()."/subject/v2",
            CURLOPT_RETURNTRANSFER => true,
            //CURLOPT_ENCODING => "",
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 30,
            //CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => "POST",
            CURLOPT_POSTFIELDS => [ "name" => $name, "store" => $store, "photo" => curl_file_create($img)],
            // or use URL
            // CURLOPT_POSTFIELDS => [ "photo" => "https://dashboard.luxand.cloud/img/brad.jpg" ],
            CURLOPT_HTTPHEADER => array("token: ".$this->getToken()),
        ));

        $response = curl_exec($curl);
        $err = curl_error($curl);

        if ($err) {
            echo "cURL Error #:" . $err;
        } else {
            echo $response;
        }
    }
}
